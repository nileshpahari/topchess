"use client";

import dynamic from "next/dynamic";

const GameClient = dynamic(() => import("./page-client"), { ssr: false });

export default function GamePage() {
  return <GameClient />;
}
