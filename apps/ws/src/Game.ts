import { Chess, Move, type Square } from "chess.js";
import { GAME_ENDED, INIT_GAME, MOVE } from "./messages";
import db from "./db";
import { randomUUID } from "crypto";
import { socketManager, User } from "./SocketManager";
import type { TimeControl } from "@prisma/client";

type GAME_STATUS = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
type GAME_RESULT = "WHITE_WINS" | "BLACK_WINS" | "DRAW";

const TIME_CONTROL_MS: Record<TimeControl, number> = {
  BULLET: 60 * 1000,
  BLITZ: 5 * 60 * 1000,
  RAPID: 10 * 60 * 1000,
  CLASSICAL: 30 * 60 * 1000,
};

export function isPromoting(chess: Chess, from: Square, to: Square) {
  if (!from) {
    return false;
  }

  const piece = chess.get(from);

  if (piece?.type !== "p") {
    return false;
  }

  if (piece.color !== chess.turn()) {
    return false;
  }

  if (!["1", "8"].some((it) => to.endsWith(it))) {
    return false;
  }

  return chess
    .moves({ square: from, verbose: true })
    .map((it) => it.to)
    .includes(to);
}

export class Game {
  public gameId: string;
  public player1UserId: string;
  public player2UserId: string | null;
  public board: Chess;
  private moveCount = 0;
  private timer: NodeJS.Timeout | null = null;
  private moveTimer: NodeJS.Timeout | null = null;
  public result: GAME_RESULT | null = null;
  private player1TimeConsumed = 0;
  private player2TimeConsumed = 0;
  private startTime = new Date(Date.now());
  private lastMoveTime = new Date(Date.now());
  private timeControl: TimeControl;

  constructor(
    player1UserId: string,
    player2UserId: string | null,
    timeControl: TimeControl = "RAPID",
    gameId?: string,
    startTime?: Date,
  ) {
    this.player1UserId = player1UserId;
    this.player2UserId = player2UserId;
    this.board = new Chess();
    this.gameId = gameId ?? randomUUID();
    this.timeControl = timeControl;
    if (startTime) {
      this.startTime = startTime;
      this.lastMoveTime = startTime;
    }
  }

  seedMoves(
    moves: {
      id: string;
      gameId: string;
      ply: number;
      from: string;
      to: string;
      comments: string | null;
      timeTaken: number | null;
      createdAt: Date;
    }[],
  ) {
    moves.forEach((move) => {
      if (isPromoting(this.board, move.from as Square, move.to as Square)) {
        this.board.move({
          from: move.from,
          to: move.to,
          promotion: "q",
        });
      } else {
        this.board.move({
          from: move.from,
          to: move.to,
        });
      }
    });
    this.moveCount = moves.length;
    const lastMove = moves.at(-1);
    if (lastMove) {
      this.lastMoveTime = lastMove.createdAt;
    }

    moves.forEach((move, index) => {
      if (move.timeTaken) {
        if (index % 2 === 0) {
          this.player1TimeConsumed += move.timeTaken;
        } else {
          this.player2TimeConsumed += move.timeTaken;
        }
      }
    });
    this.resetAbandonTimer();
    this.resetMoveTimer();
  }
  async updateSecondPlayer(player2UserId: string) {
    this.player2UserId = player2UserId;

    const users = await db.user.findMany({
      where: {
        id: {
          in: [this.player1UserId, this.player2UserId ?? ""],
        },
      },
    });

    try {
      await this.createGameInDb();
    } catch (e) {
      console.error(e);
      return;
    }

    const WhitePlayer = users.find((user) => user.id === this.player1UserId);
    const BlackPlayer = users.find((user) => user.id === this.player2UserId);

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          whitePlayer: {
            username: WhitePlayer?.username,
            id: this.player1UserId,
            isGuest: WhitePlayer?.provider === "GUEST",
          },
          blackPlayer: {
            username: BlackPlayer?.username,
            id: this.player2UserId,
            isGuest: BlackPlayer?.provider === "GUEST",
          },
          fen: this.board.fen(),
          timeControl: this.timeControl,
          moves: [],
        },
      }),
    );
    this.resetAbandonTimer();
    this.resetMoveTimer();
  }

  async createGameInDb() {
    if (!this.player2UserId) {
      throw new Error("Cannot create game without a black player");
    }

    this.startTime = new Date(Date.now());
    this.lastMoveTime = this.startTime;

    const [whitePlayer, blackPlayer] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: this.player1UserId } }),
      db.user.findUniqueOrThrow({ where: { id: this.player2UserId } }),
    ]);

	console.log(whitePlayer, blackPlayer);

    const game = await db.game.create({
      data: {
        id: this.gameId,
        mode: "CASUAL",
        whiteRating: whitePlayer.rating,
        blackRating: blackPlayer.rating,
        timeControl: this.timeControl,
        status: "IN_PROGRESS",
        startAt: this.startTime,
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        whitePlayer: {
          connect: {
            id: this.player1UserId,
          },
        },
        blackPlayer: {
          connect: {
            id: this.player2UserId ?? "",
          },
        },
      },
    });
    this.gameId = game.id;
  }

  async addMoveToDb(move: Move, moveTimestamp: Date) {
    await db.$transaction([
      db.move.create({
        data: {
          gameId: this.gameId,
          ply: this.moveCount + 1,
          from: move.from,
          to: move.to,
          before: move.before,
          after: move.after,
          createdAt: moveTimestamp,
          timeTaken: moveTimestamp.getTime() - this.lastMoveTime.getTime(),
          san: move.san,
        },
      }),
      db.game.update({
        data: {
          currentFen: move.after,
        },
        where: {
          id: this.gameId,
        },
      }),
    ]);
  }

  async makeMove(user: User, move: Move) {
    // validate the type of move using zod
    if (this.board.turn() === "w" && user.userId !== this.player1UserId) {
      return;
    }

    if (this.board.turn() === "b" && user.userId !== this.player2UserId) {
      return;
    }

    if (this.result) {
      console.error(
        `User ${user.userId} is making a move post game completion`,
      );
      return;
    }

    const moveTimestamp = new Date(Date.now());

    let validatedMove: Move;
    try {
      if (isPromoting(this.board, move.from, move.to)) {
        validatedMove = this.board.move({
          from: move.from,
          to: move.to,
          promotion: "q",
        });
      } else {
        validatedMove = this.board.move({
          from: move.from,
          to: move.to,
        });
      }
    } catch (e) {
      console.error("Error while making move");
      return;
    }

    // flipped because move has already happened
    if (this.board.turn() === "b") {
      this.player1TimeConsumed =
        this.player1TimeConsumed +
        (moveTimestamp.getTime() - this.lastMoveTime.getTime());
    }

    if (this.board.turn() === "w") {
      this.player2TimeConsumed =
        this.player2TimeConsumed +
        (moveTimestamp.getTime() - this.lastMoveTime.getTime());
    }

    await this.addMoveToDb(validatedMove, moveTimestamp);
    this.resetAbandonTimer();
    this.resetMoveTimer();

    this.lastMoveTime = moveTimestamp;

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: MOVE,
        payload: {
          move: validatedMove,
          player1TimeConsumed: this.player1TimeConsumed,
          player2TimeConsumed: this.player2TimeConsumed,
        },
      }),
    );

    if (this.board.isGameOver()) {
      const result = this.board.isDraw()
        ? "DRAW"
        : this.board.turn() === "b"
          ? "WHITE_WINS"
          : "BLACK_WINS";

      await this.endGame("COMPLETED", result);
    }

    this.moveCount++;
  }

  getPlayer1TimeConsumed() {
    if (this.board.turn() === "w") {
      return (
        this.player1TimeConsumed +
        (new Date(Date.now()).getTime() - this.lastMoveTime.getTime())
      );
    }
    return this.player1TimeConsumed;
  }

  getPlayer2TimeConsumed() {
    if (this.board.turn() === "b") {
      return (
        this.player2TimeConsumed +
        (new Date(Date.now()).getTime() - this.lastMoveTime.getTime())
      );
    }
    return this.player2TimeConsumed;
  }

  async resetAbandonTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.endGame(
        "ABANDONED",
        this.board.turn() === "b" ? "WHITE_WINS" : "BLACK_WINS",
      );
    }, 60 * 1000);
  }

  async resetMoveTimer() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
    }
    const turn = this.board.turn();
    const timeLeft =
      TIME_CONTROL_MS[this.timeControl] -
      (turn === "w" ? this.player1TimeConsumed : this.player2TimeConsumed);

    if (timeLeft <= 0) {
      await this.endGame(
        "COMPLETED",
        turn === "b" ? "WHITE_WINS" : "BLACK_WINS",
      );
      return;
    }

    this.moveTimer = setTimeout(() => {
      this.endGame("COMPLETED", turn === "b" ? "WHITE_WINS" : "BLACK_WINS");
    }, timeLeft);
  }

  async exitGame(user: User) {
    await this.endGame(
      "ABANDONED",
      user.userId === this.player2UserId ? "WHITE_WINS" : "BLACK_WINS",
    );
  }

  async endGame(status: GAME_STATUS, result: GAME_RESULT) {
    if (this.result) {
      return;
    }

    this.result = result;
    this.clearTimer();
    this.clearMoveTimer();

    const updatedGame = await db.game.update({
      data: {
        status,
        result: result,
        endAt: new Date(Date.now()),
      },
      where: {
        id: this.gameId,
      },
      include: {
        moves: {
          orderBy: {
            ply: "asc",
          },
        },
        blackPlayer: true,
        whitePlayer: true,
      },
    });

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: GAME_ENDED,
        payload: {
          result,
          status,
          moves: updatedGame.moves,
          blackPlayer: {
            id: updatedGame.blackPlayer.id,
            username: updatedGame.blackPlayer.username,
            isGuest: updatedGame.blackPlayer.provider === "GUEST",
          },
          whitePlayer: {
            id: updatedGame.whitePlayer.id,
            username: updatedGame.whitePlayer.username,
            isGuest: updatedGame.whitePlayer.provider === "GUEST",
          },
        },
      }),
    );
  }

  clearMoveTimer() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
  }

  setTimer(timer: NodeJS.Timeout) {
    this.timer = timer;
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }
}
