"use client";

import { AppProviders } from "../providers";
import Login from "@/screens/Login";

export default function LoginClient() {
  return (
    <AppProviders>
      <Login />
    </AppProviders>
  );
}
