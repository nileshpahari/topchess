"use client";

import { AppProviders } from "../providers";
import { Layout } from "@/layout";
import { Settings } from "@/screens/Settings";

export default function SettingsClient() {
  return (
    <AppProviders>
      <Layout>
        <Settings />
      </Layout>
    </AppProviders>
  );
}
