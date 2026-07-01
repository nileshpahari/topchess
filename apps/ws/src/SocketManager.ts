import { randomUUID } from "crypto";
import { WebSocket } from "ws";
import type { AuthUser } from "./auth";

export class User {
  public socket: WebSocket;
  public id: string;
  public userId: string;
  public username: string;
  public isGuest: boolean;

  constructor(socket: WebSocket, user: AuthUser) {
    this.socket = socket;
    this.userId = user.id;
    this.id = randomUUID();
    this.username = user.username;
    this.isGuest = user.isGuest;
  }
}

class SocketManager {
  private static instance: SocketManager;
  private interestedSockets: Map<string, User[]>;
  private userRoomMappping: Map<string, string>;

  private constructor() {
    this.interestedSockets = new Map<string, User[]>();
    this.userRoomMappping = new Map<string, string>();
  }

  static getInstance() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    }

    SocketManager.instance = new SocketManager();
    return SocketManager.instance;
  }

  addUser(user: User, roomId: string) {
    const users = this.interestedSockets.get(roomId) || [];
    if (users.some((roomUser) => roomUser.id === user.id)) {
      return;
    }

    this.interestedSockets.set(roomId, [...users, user]);
    this.userRoomMappping.set(user.id, roomId);
  }

  broadcast(roomId: string, message: string) {
    const users = this.interestedSockets.get(roomId);
    if (!users) {
      console.error("No users in room?");
      return;
    }

    users.forEach((user) => {
      user.socket.send(message);
    });
  }

  removeUser(user: User) {
    const roomId = this.userRoomMappping.get(user.id);
    if (!roomId) {
      return;
    }
    const room = this.interestedSockets.get(roomId) || [];
    const remainingUsers = room.filter((u) => u.id !== user.id);
    this.interestedSockets.set(roomId, remainingUsers);
    if (this.interestedSockets.get(roomId)?.length === 0) {
      this.interestedSockets.delete(roomId);
    }
    this.userRoomMappping.delete(user.id);
  }
}

export const socketManager = SocketManager.getInstance();
