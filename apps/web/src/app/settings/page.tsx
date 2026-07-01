"use client";

import dynamic from "next/dynamic";

const SettingsClient = dynamic(() => import("./page-client"), { ssr: false });

export default function SettingsPage() {
  return <SettingsClient />;
}
