import { configureStore } from "@reduxjs/toolkit";
import { chessBoardReducer } from "./slices/chessBoard";
import { userReducer } from "./slices/user";

export const store = configureStore({
  reducer: {
    chessBoard: chessBoardReducer,
    user: userReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
