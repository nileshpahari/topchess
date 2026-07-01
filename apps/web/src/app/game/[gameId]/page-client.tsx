"use client";

import { AppProviders } from "../../providers";
import { Layout } from "@/layout";
import { Game } from "@/screens/Game";

export default function GameClient() {
  return (
    <AppProviders>
      <Layout>
        <Game />
      </Layout>
    </AppProviders>
  );
}
