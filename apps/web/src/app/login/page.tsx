"use client";

import dynamic from "next/dynamic";

const LoginClient = dynamic(() => import("./page-client"), { ssr: false });

export default function LoginPage() {
  return <LoginClient />;
}
