import type { PrivyClientConfig } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

/**
 * Email + wallet Privy config for Solana.
 * Requires email and Solana wallet auth enabled in the Privy Dashboard
 * (Authentication > login methods) and NEXT_PUBLIC_PRIVY_APP_ID set.
 * Email users get an embedded Solana wallet so they have a sender address
 * for deposits; external-wallet users keep using their own wallets.
 */
export function buildPrivyConfig(): PrivyClientConfig {
  const config: PrivyClientConfig = {
    loginMethods: ["email", "wallet"],
    appearance: {
      walletChainType: "solana-only",
    },
    embeddedWallets: {
      solana: { createOnLogin: "users-without-wallets" },
    },
  };
  // toSolanaWalletConnectors() sniffs browser wallets and crashes during
  // SSR/prerender, so only attach external Solana connectors on the client.
  // Set shouldAutoConnect: false so Privy does not automatically connect to
  // all browser wallet extensions without explicit user action.
  if (typeof window !== "undefined") {
    config.externalWallets = {
      solana: {
        connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
      },
    };
  }
  return config;
}
