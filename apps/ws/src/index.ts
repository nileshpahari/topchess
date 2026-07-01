import "dotenv/config";
import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";
import { getAuthUser } from "./auth";
import { parseCookie } from "cookie";

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();

const allowedOrigins = process.env.ALLOWED_HOSTS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function getAuthToken(cookieHeader: string | undefined) {
  if (!cookieHeader) return null;

  const cookies = parseCookie(cookieHeader);
  return cookies.jwt ?? cookies.guest ?? null;
}

wss.on("connection", function connection(ws, req) {
  if (allowedOrigins?.length) {
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
      ws.close(1008, "Origin not allowed");
      return;
    }
  }

  const token = getAuthToken(req.headers.cookie);
  if (!token) {
    ws.close(1008, "Missing auth token");
    return;
  }

  const user = getAuthUser(token, ws);
  if (!user) {
    ws.close(1008, "Invalid auth token");
    return;
  }

  gameManager.addUser(user);

  ws.on("close", () => {
    gameManager.removeUser(ws);
  });
});

console.log("done");
