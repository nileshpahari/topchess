// Wire protocol and domain types shared between the game screen and the
// components it renders.
// TODO: these constants are duplicated in apps/ws/src/messages.ts — moving them
// into a shared package would turn drift into a type error.
export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const OPPONENT_DISCONNECTED = 'opponent_disconnected';
export const GAME_OVER = 'game_over';
export const JOIN_ROOM = 'join_room';
export const GAME_JOINED = 'game_joined';
export const GAME_NOT_FOUND = 'game_not_found';
export const GAME_ALERT = 'game_alert';
export const GAME_ADDED = 'game_added';
export const USER_TIMEOUT = 'user_timeout';
export const GAME_TIME = 'game_time';
export const GAME_ENDED = 'game_ended';
export const EXIT_GAME = 'exit_game';
export const CHAT_MESSAGE = 'chat_message';

export enum Result {
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}

export interface Player {
  id: string;
  username: string;
  isGuest: boolean;
}

export interface GameResult {
  result: Result;
  by: string;
  whiteRatingChange?: number | null;
  blackRatingChange?: number | null;
}

export interface Metadata {
  blackPlayer: Player;
  whitePlayer: Player;
}
