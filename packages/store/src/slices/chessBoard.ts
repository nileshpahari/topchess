import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Move } from "chess.js";

export interface SerializableMove {
  after: string;
  before: string;
  captured?: string;
  color?: string;
  flags?: string;
  from: string;
  lan?: string;
  piece?: string;
  promotion?: string;
  san: string;
  to: string;
}

function getPromotionFromSan(san: string) {
  const promotion = san.match(/=([QRBN])/i)?.[1]?.toLowerCase();
  return promotion === "q" || promotion === "r" || promotion === "b" || promotion === "n"
    ? promotion
    : undefined;
}

export function toSerializableMove(move: Move | SerializableMove): SerializableMove {
  return {
    after: move.after,
    before: move.before,
    captured: move.captured,
    color: move.color,
    flags: move.flags,
    from: move.from,
    lan: move.lan,
    piece: move.piece,
    promotion: move.promotion ?? getPromotionFromSan(move.san),
    san: move.san,
    to: move.to,
  };
}

interface ChessBoardState {
  isBoardFlipped: boolean;
  moves: SerializableMove[];
  userSelectedMoveIndex: number | null;
}

const initialState: ChessBoardState = {
  isBoardFlipped: false,
  moves: [],
  userSelectedMoveIndex: null,
};

const chessBoardSlice = createSlice({
  name: "chessBoard",
  initialState,
  reducers: {
    setIsBoardFlipped(state, action: PayloadAction<boolean>) {
      state.isBoardFlipped = action.payload;
    },
    toggleBoardFlipped(state) {
      state.isBoardFlipped = !state.isBoardFlipped;
    },
    setMoves(state, action: PayloadAction<Array<Move | SerializableMove>>) {
      state.moves = action.payload.map(toSerializableMove);
    },
    appendMove(state, action: PayloadAction<Move | SerializableMove>) {
      state.moves.push(toSerializableMove(action.payload));
    },
    setUserSelectedMoveIndex(state, action: PayloadAction<number | null>) {
      state.userSelectedMoveIndex = action.payload;
    },
  },
});

export const {
  appendMove,
  setIsBoardFlipped,
  setMoves,
  setUserSelectedMoveIndex,
  toggleBoardFlipped,
} = chessBoardSlice.actions;
export const chessBoardReducer = chessBoardSlice.reducer;
