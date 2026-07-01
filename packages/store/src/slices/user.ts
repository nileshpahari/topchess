import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

const getBackendUrl = () => {
  const env = typeof process !== "undefined" ? process.env : undefined;
  return env?.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
};

export interface User {
  id: string;
  username: string;
  isGuest: boolean;
}

interface UserState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UserState = {
  user: null,
  status: "idle",
  error: null,
};

export const refreshUser = createAsyncThunk<User | null>(
  "user/refresh",
  async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/auth/refresh`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        return (await response.json()) as User;
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.status = "succeeded";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.user = null;
        state.status = "failed";
        state.error = action.error.message ?? "Failed to refresh user";
      });
  },
});

export const { clearUser, setUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
