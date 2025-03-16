import { WebSocketServer } from "ws";
import { GameManager } from "./utils/GameManager";
import http from "http"

const server = http.createServer();

const wss = new WebSocketServer({server});

const gameManager = new GameManager();

wss.on("connection", function connection(ws) {
  gameManager.addUser(ws);
  ws.on("disconnect", () => gameManager.removeUser(ws));
});

server.listen(8080)
