"use client";

import { useMemo } from "react";
import { usePrivy, type WalletWithMetadata } from "@privy-io/react-auth";
import {
  useWallets as useSolanaWallets,
  type ConnectedStandardSolanaWallet,
} from "@privy-io/react-auth/solana";

export interface ConnectedSolanaWallet {
  address: string;
  chainType: "solana";
  walletClientType: string;
  label: string;
  connectorType?: string;
  isEmbedded: boolean;
  isPrimary: boolean;
  standardWallet?: ConnectedStandardSolanaWallet;
}

function formatWalletLabel(
  walletClientType: string,
  isEmbedded: boolean
): string {
  if (isEmbedded || walletClientType === "privy") {
    return "Embedded wallet";
  }
  const clean = walletClientType.toLowerCase();
  if (clean === "phantom") return "Phantom";
  if (clean === "solflare") return "Solflare";
  if (clean === "backpack") return "Backpack";
  if (clean === "coinbase_wallet") return "Coinbase Wallet";
  if (clean === "okx_wallet") return "OKX Wallet";
  if (clean) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return "Solana wallet";
}

/**
 * Returns strictly the authenticated user's linked/connected Solana wallets.
 *
 * Unlike raw `useSolanaWallets()` (which sniffs and returns accounts for every
 * detected wallet standard extension in the browser, even unconnected ones),
 * this hook filters strictly by the authenticated Privy user's linked accounts.
 */
export function useConnectedWallets() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets: rawWallets } = useSolanaWallets();

  const wallets = useMemo<ConnectedSolanaWallet[]>(() => {
    if (!ready || !authenticated || !user) {
      return [];
    }

    const linkedAccounts = user.linkedAccounts ?? [];
    const linkedSolanaWallets = linkedAccounts.filter(
      (account): account is WalletWithMetadata =>
        account.type === "wallet" && account.chainType === "solana"
    );

    const primaryAddress =
      user.wallet && user.wallet.chainType === "solana"
        ? user.wallet.address
        : linkedSolanaWallets[0]?.address ?? null;

    const seenAddresses = new Set<string>();
    const result: ConnectedSolanaWallet[] = [];

    for (const item of linkedSolanaWallets) {
      const addr = item.address;
      if (!addr || seenAddresses.has(addr.toLowerCase())) continue;
      seenAddresses.add(addr.toLowerCase());

      const isEmbedded =
        item.walletClientType === "privy" || item.connectorType === "embedded";
      const label = formatWalletLabel(
        item.walletClientType || "",
        isEmbedded
      );
      const isPrimary =
        Boolean(primaryAddress) &&
        addr.toLowerCase() === primaryAddress!.toLowerCase();

      const standardWallet = rawWallets.find(
        (w) => w.address.toLowerCase() === addr.toLowerCase()
      );

      result.push({
        address: addr,
        chainType: "solana",
        walletClientType:
          item.walletClientType || (isEmbedded ? "privy" : "unknown"),
        label,
        connectorType: item.connectorType,
        isEmbedded,
        isPrimary,
        standardWallet,
      });
    }

    if (
      user.wallet &&
      user.wallet.chainType === "solana" &&
      user.wallet.address &&
      !seenAddresses.has(user.wallet.address.toLowerCase())
    ) {
      const addr = user.wallet.address;
      seenAddresses.add(addr.toLowerCase());
      const isEmbedded =
        user.wallet.walletClientType === "privy" ||
        user.wallet.connectorType === "embedded";
      const label = formatWalletLabel(
        user.wallet.walletClientType || "",
        isEmbedded
      );
      const standardWallet = rawWallets.find(
        (w) => w.address.toLowerCase() === addr.toLowerCase()
      );

      result.unshift({
        address: addr,
        chainType: "solana",
        walletClientType:
          user.wallet.walletClientType || (isEmbedded ? "privy" : "unknown"),
        label,
        connectorType: user.wallet.connectorType,
        isEmbedded,
        isPrimary: true,
        standardWallet,
      });
    }

    return result.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return 0;
    });
  }, [ready, authenticated, user, rawWallets]);

  const primaryWallet = wallets[0] ?? null;
  const isCreating = Boolean(
    authenticated && ready && user && wallets.length === 0
  );

  return {
    ready,
    authenticated,
    user,
    wallets,
    primaryWallet,
    isCreating,
  };
}

