"use client";

import { AppProviders } from "./providers";
import { Layout } from "@/layout";
import { Landing } from "@/screens/Landing";

export default function HomeClient() {
  return (
    <AppProviders>
      <Layout>
        <Landing />
      </Layout>
    </AppProviders>
  );
}
