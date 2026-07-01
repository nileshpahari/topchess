"use client";

import { Suspense, type ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { Loader } from "@/components/Loader";
import { store } from "@repo/store/store";
import { refreshUser } from "@repo/store/user";

function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(refreshUser());
  }, []);

  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bgMain text-textMain">
      <Provider store={store}>
        <Suspense fallback={<Loader />}>
          <AuthBootstrap>{children}</AuthBootstrap>
        </Suspense>
      </Provider>
    </div>
  );
}
