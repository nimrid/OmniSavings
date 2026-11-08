"use client";

import { useMemo } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { buildPrivyConfig } from "@/lib/privy/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
  const config = useMemo(() => buildPrivyConfig(), []);

  if (!appId) {
    if (typeof window !== "undefined") {
      console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set; wallet auth disabled.");
    }
    return <>{children}</>;
  }
  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId || undefined}
      config={config}
    >
      {children}
    </PrivyProvider>
  );
}
