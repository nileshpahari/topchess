"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./page-client"), { ssr: false });

export default function Home() {
  return <HomeClient />;
}
