import { WebSocket } from "ws";
import {
  INIT_GAME,
  MOVE,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ALERT,
  GAME_ADDED,
  GAME_ENDED,
  EXIT_GAME,
} from "./messages";
import { Game } from "./Game";
import db from "./db";
import { socketManager, User } from "./SocketManager";
import { GameStatus, type TimeControl } from "@prisma/client";

const TIME_CONTROLS = new Set<TimeControl>([
  "BULLET",
  "BLITZ",
  "RAPID",
  "CLASSICAL",
]);

function getTimeControl(value: unknown): TimeControl {
  return typeof value === "string" && TIME_CONTROLS.has(value as TimeControl)
    ? (value as TimeControl)
    : "RAPID";
}

export class GameManager {
  private games: Game[];
  private pendingGameId: string | null;
  private users: User[];

  constructor() {
    this.games = [];
    this.pendingGameId = null;
    this.users = [];
  }

  addUser(user: User) {
    this.users.push(user);
    this.addHandler(user);
  }

  removeUser(socket: WebSocket) {
    const user = this.users.find((user) => user.socket === socket);
    if (!user) {
	  console.error('User not found');
      return;
    }
    this.users = this.users.filter((user) => user.socket !== socket);
    socketManager.removeUser(user);

    const pendingGame = this.pendingGameId
      ? this.games.find((game) => game.gameId === this.pendingGameId)
      : null;
    if (
      pendingGame &&
      pendingGame.player1UserId === user.userId &&
      !pendingGame.player2UserId
    ) {
      this.removeGame(pendingGame.gameId);
    }
  }

  removeGame(gameId: string) {
    this.games = this.games.filter((g) => g.gameId !== gameId);
    if (this.pendingGameId === gameId) {
      this.pendingGameId = null;
    }
  }

  private addHandler(user: User) {
    user.socket.on("message", async (data) => {
      let message: { type?: string; payload?: any };
      try {
        message = JSON.parse(data.toString());
      } catch {
        user.socket.send(
          JSON.stringify({
            type: GAME_ALERT,
            payload: { message: "Invalid message format" },
          }),
        );
        return;
      }

      try {
        if (message.type === INIT_GAME) {
          if (this.pendingGameId) {
            const game = this.games.find(
              (x) => x.gameId === this.pendingGameId,
            );
            if (!game) {
              console.error("Pending game not found?");
              return;
            }
            if (user.userId === game.player1UserId) {
              socketManager.broadcast(
                game.gameId,
                JSON.stringify({
                  type: GAME_ALERT,
                  payload: {
                    message: "Trying to Connect with yourself?",
                  },
                }),
              );
              return;
            }
            socketManager.addUser(user, game.gameId);
            await game?.updateSecondPlayer(user.userId);
            this.pendingGameId = null;
          } else {
            const timeControl = getTimeControl(message.payload?.timeControl);
            const game = new Game(user.userId, null, timeControl);
            this.games.push(game);
            this.pendingGameId = game.gameId;
            socketManager.addUser(user, game.gameId);
            socketManager.broadcast(
              game.gameId,
              JSON.stringify({
                type: GAME_ADDED,
                gameId: game.gameId,
                timeControl,
              }),
            );
          }
        }

        if (message.type === MOVE) {
          const gameId = message.payload?.gameId;
          const game = this.games.find((game) => game.gameId === gameId);
          if (game) {
            await game.makeMove(user, message.payload.move);
            if (game.result) {
              this.removeGame(game.gameId);
            }
          }
        }

        if (message.type === EXIT_GAME) {
          const gameId = message.payload?.gameId;
          const game = this.games.find((game) => game.gameId === gameId);

          if (game) {
            await game.exitGame(user);
            this.removeGame(game.gameId);
          }
        }

        if (message.type === JOIN_ROOM) {
          const gameId = message.payload?.gameId;
          if (!gameId) {
            return;
          }

          let availableGame = this.games.find((game) => game.gameId === gameId);
          const gameFromDb = await db.game.findUnique({
            where: { id: gameId },
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

          // There is a game created but no second player available

          if (availableGame && !availableGame.player2UserId) {
            if (user.userId === availableGame.player1UserId) {
              user.socket.send(
                JSON.stringify({
                  type: GAME_ALERT,
                  payload: {
                    message: "Trying to connect with yourself?",
                  },
                }),
              );
              return;
            }
            socketManager.addUser(user, availableGame.gameId);
            await availableGame.updateSecondPlayer(user.userId);
            return;
          }

          if (!gameFromDb) {
            user.socket.send(
              JSON.stringify({
                type: GAME_NOT_FOUND,
              }),
            );
            return;
          }

          if (gameFromDb.status !== GameStatus.IN_PROGRESS) {
            user.socket.send(
              JSON.stringify({
                type: GAME_ENDED,
                payload: {
                  result: gameFromDb.result,
                  status: gameFromDb.status,
                  moves: gameFromDb.moves,
                  blackPlayer: {
                    id: gameFromDb.blackPlayer.id,
                    username: gameFromDb.blackPlayer.username,
                  },
                  whitePlayer: {
                    id: gameFromDb.whitePlayer.id,
                    username: gameFromDb.whitePlayer.username,
                  },
                },
              }),
            );
            return;
          }

          if (!availableGame) {
            const game = new Game(
              gameFromDb?.whitePlayerId!,
              gameFromDb?.blackPlayerId!,
              gameFromDb.timeControl,
              gameFromDb.id,
              gameFromDb.startAt,
            );
            game.seedMoves(gameFromDb?.moves || []);
            this.games.push(game);
            availableGame = game;
          }

          user.socket.send(
            JSON.stringify({
              type: GAME_JOINED,
              payload: {
                gameId,
                timeControl: gameFromDb.timeControl,
                moves: gameFromDb.moves,
                blackPlayer: {
                  id: gameFromDb.blackPlayer.id,
                  username: gameFromDb.blackPlayer.username,
                },
                whitePlayer: {
                  id: gameFromDb.whitePlayer.id,
                  username: gameFromDb.whitePlayer.username,
                },
                player1TimeConsumed: availableGame.getPlayer1TimeConsumed(),
                player2TimeConsumed: availableGame.getPlayer2TimeConsumed(),
              },
            }),
          );

          socketManager.addUser(user, gameId);
        }
      } catch (error) {
        console.error("Failed to handle websocket message", error);
        user.socket.send(
          JSON.stringify({
            type: GAME_ALERT,
            payload: { message: "Failed to handle message" },
          }),
        );
      }
    });
  }
}
