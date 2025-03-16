interface THEME_DATA {
  background: string;
  "board-light": string;
  "board-dark": string;
  "board-image": string;
}
export const THEMES_DATA: THEME_DATA = {
  background: "#302E2B",
  "board-light": "#EBECD0",
  "board-dark": "#739552",
  "board-image":
    "https://www.chess.com/bundles/web/images/offline-play/standardboard.1d6f9426.png",
};

export const WS_URL = "ws://localhost:8080";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
