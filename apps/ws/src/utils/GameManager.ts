import { Game } from "./Game";
import { WebSocket } from "ws";
import { INIT_GAME, MOVE } from "./constants";

export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;
  private users: WebSocket[];
  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }

  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.messageHandler(socket);
  }
  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
  }

  private messageHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      try {
        const messageStr = data.toString().trim();
        // // if (!messageStr.startsWith("{") || !messageStr.endsWith("}")) {
        // //   throw new Error("Invalid JSON format");
        // }
        const message = JSON.parse(messageStr);

        if (message.type === INIT_GAME) {
          if (!this.pendingUser) {
            this.pendingUser = socket;
          } else {
            const game = new Game(this.pendingUser, socket);
            this.games.push(game);
            this.pendingUser = null;
          }
        }

        if (message.type === MOVE) {
          const interestedGame = this.games.find(
            (game) => game.player1 == socket || game.player2 == socket
          );
          if (interestedGame) {
            interestedGame.makeMove(socket, message.payload.move);
          }
        }
      } catch (error) {
        console.log("WS Error: ", error);
      }
    });
  }
}
