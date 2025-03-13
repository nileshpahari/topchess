import { Chess } from "chess.js";
import { Data, WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

type Turn = "white" | "black";
export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  public board: Chess;
  private startTime: Date;
  private moveCount = 0;
  private turn: Turn = "white";

  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          colour: "white",
        },
      })
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          colour: "black",
        },
      })
    );
  }

  makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
    if (this.moveCount % 2 == 0) this.turn = "white";
    if (this.moveCount % 2 == 1) this.turn = "black";
    //early return for wrong turn
    if (this.turn == "white" && socket != this.player1) {
      return;
    }
    if (this.turn == "black" && socket != this.player2) {
      return;
    }

    try {
      this.board.move(move);
    } catch (err) {
      console.log(err);
      return;
    }

    if (this.turn == "white") {
      this.player2.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    } else {
      this.player1.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    }

    if (this.board.isGameOver()) {
      this.player1.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.turn,
          },
        })
      );
      this.player2.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.turn,
          },
        })
      );
    }

    this.moveCount++;
  }
}
