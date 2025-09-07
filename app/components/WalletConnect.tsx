// app/components/WalletConnect.tsx
"use client";

import React, { useEffect, useState } from "react";
import { getAddress, BrowserProvider } from "ethers";

/**
 * WalletConnect
 * - Prefers injected provider (MetaMask).
 * - If none present, shows a chooser modal (no auto-open deep links).
 * - "Connect with WalletConnect" attempts to dynamically load @walletconnect/web3-provider
 *   and initialize it only when the user explicitly requests it.
 *
 * Improvements:
 * - Handles user rejection (ethers error code 4001) gracefully with a UI message + retry.
 * - Debounces connect requests with `connecting` state to avoid multiple popups.
 */
export default function WalletConnect({ onConnect }: { onConnect?: (address: string) => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // chooser modal state
  const [chooserOpen, setChooserOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [wcConnecting, setWcConnecting] = useState(false);

  // New UX states
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const provider = (window as any).ethereum;
    if (!provider) return;

    // initial accounts check
    provider.request?.({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts && accounts[0]) {
        try {
          const norm = getAddress(accounts[0]);
          setAddress(norm);
          onConnect?.(norm);
        } catch { /* ignore */ }
      }
    }).catch(() => {});

    // initial chain id check (eth_chainId)
    provider.request?.({ method: "eth_chainId" }).then((hex: string) => {
      try {
        setChainId(parseInt(hex, 16));
      } catch {
        setChainId(null);
      }
    }).catch(() => {});

    // listeners
    const handleAccounts = (accounts: string[] | unknown) => {
      const first = Array.isArray(accounts) ? (accounts as any)[0] : (accounts as any);
      if (!first) {
        setAddress(null);
        onConnect?.("");
        return;
      }
      try {
        const norm = getAddress(first);
        setAddress(norm);
        onConnect?.(norm);
      } catch {
        setAddress(null);
        onConnect?.("");
      }
    };

    const handleChain = (chainHex: string) => {
      try {
        setChainId(parseInt(chainHex as any, 16));
      } catch {
        setChainId(null);
      }
    };

    provider.on?.("accountsChanged", handleAccounts);
    provider.on?.("chainChanged", handleChain);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
      provider.removeListener?.("chainChanged", handleChain);
    };
  }, [onConnect]);

  async function connect() {
    // prevent parallel connect attempts
    if (connecting) return;
    setConnectError(null);
    setConnecting(true);

    if (typeof window !== "undefined") {
      console.log('connect click - userAgent:', navigator.userAgent);
      console.log('connect click - window.ethereum present?', !!(window as any).ethereum);
      console.log('connect click - isMetaMask?', !!(window as any).ethereum?.isMetaMask);
    }

    const ethProvider = (typeof window !== "undefined") ? (window as any).ethereum : null;

    // If injected provider exists -> prefer it (this opens MetaMask popup)
    if (ethProvider) {
      try {
        // prefer direct request first so extension shows popup
        await ethProvider.request?.({ method: "eth_requestAccounts" });

        // create BrowserProvider, signer etc.
        const web3Provider = new BrowserProvider(ethProvider);
        const signer = await web3Provider.getSigner();
        const addr = await signer.getAddress();
        const net = await web3Provider.getNetwork();

        const normalized = getAddress(addr);
        setAddress(normalized);
        setChainId(typeof net.chainId === "bigint" ? Number(net.chainId) : (net.chainId as number));
        onConnect?.(normalized);
        setConnecting(false);
        return;
      } catch (err: any) {
        // handle user rejection (ethers wraps provider rejections)
        const code = err?.error?.code ?? err?.code ?? null;
        const msg = err?.message ?? String(err);

        if (code === 4001 || /user rejected/i.test(msg)) {
          // user intentionally rejected the popup
          setConnectError("Connection request rejected. Click Connect to try again.");
          setConnecting(false);
          return;
        }

        console.warn("Injected provider connect failed (falling back to chooser):", err);
        // fall through to chooser/modal
      }
    }

    // No injected provider (or it failed) -> open chooser modal instead of auto-opening a deep link
    setChooserOpen(true);
    setConnecting(false);
  }

  // Copy current URL to clipboard and show instructions to open in MetaMask app browser
  async function handleOpenInMetaMaskApp() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("URL copied. Open the MetaMask app, paste the URL in its browser, and connect.");
      // keep modal open so user can read instructions
    } catch (err) {
      setToast("Failed to copy URL. Please manually copy the page URL and open MetaMask app.");
    }
  }

  // Try to dynamically init WalletConnect provider (only on explicit click).
  // This requires @walletconnect/web3-provider to be installed. If not present,
  // we show helpful instructions instead of auto-opening a link.
  async function handleWalletConnect() {
    if (wcConnecting) return;
    setWcConnecting(true);
    setConnectError(null);

    try {
      // Attempt dynamic import of the provider
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import("@walletconnect/web3-provider");
      const WalletConnectProvider = (mod as any).default ?? (mod as any);
      // rpc mapping: try to use NEXT_PUBLIC_ZKSYNC_RPC or fallback to Ethereum main public RPC
      const rpcUrl = (process.env.NEXT_PUBLIC_ZKSYNC_RPC as string | undefined) ?? "https://mainnet.infura.io/v3/";
      const provider = new WalletConnectProvider({
        rpc: { 1: rpcUrl },
      });

      // Enable session (shows QR or mobile deep-link chooser)
      await provider.enable();

      // create ethers provider from WalletConnect provider
      const web3Provider = new BrowserProvider(provider as any);
      const signer = await web3Provider.getSigner();
      const addr = await signer.getAddress();
      const net = await web3Provider.getNetwork();

      const normalized = getAddress(addr);
      setAddress(normalized);
      setChainId(typeof net.chainId === "bigint" ? Number(net.chainId) : (net.chainId as number));
      onConnect?.(normalized);

      setChooserOpen(false);
      setToast("Connected via WalletConnect");
    } catch (err: any) {
      // handle WalletConnect specific user rejection if any, otherwise show friendly message
      const code = err?.error?.code ?? err?.code ?? null;
      const msg = err?.message ?? String(err);
      if (code === 4001 || /user rejected/i.test(msg)) {
        setConnectError("WalletConnect connection rejected. Try again if you want to connect.");
      } else {
        console.warn("WalletConnect flow unavailable or failed:", err);
        setToast(
          "WalletConnect not available. You can install a WalletConnect-compatible wallet or open the page inside MetaMask mobile."
        );
      }
    } finally {
      setWcConnecting(false);
    }
  }

  function short(addr?: string | null) {
    if (!addr) return "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {address ? (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded bg-neutral-800 text-sm">{short(address)}</div>
            <div className="text-xs text-neutral-400">chain: {chainId ?? "unknown"}</div>
          </div>
        ) : (
          <div>
            <button
              onClick={connect}
              disabled={connecting}
              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-sm disabled:opacity-60"
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
            {connectError && (
              <div className="mt-2 text-sm text-red-400">
                {connectError}{" "}
                <button
                  onClick={() => {
                    setConnectError(null);
                    connect();
                  }}
                  className="underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chooser modal */}
      {chooserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-neutral-900 rounded p-6">
            <h3 className="text-lg font-semibold mb-3">Connect a Wallet</h3>
            <p className="text-sm text-neutral-400 mb-4">
              No injected wallet detected on this browser. Choose an option:
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleOpenInMetaMaskApp}
                className="w-full px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
              >
                Open in MetaMask app browser (copy URL)
              </button>

              <button
                onClick={handleWalletConnect}
                disabled={wcConnecting}
                className="w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm disabled:opacity-60"
              >
                {wcConnecting ? "Connecting…" : "Connect with WalletConnect"}
              </button>

              <button
                onClick={() => setChooserOpen(false)}
                className="w-full px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
              >
                Cancel
              </button>
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Tip: On mobile, for the smoothest experience open this page inside the MetaMask mobile app.
            </p>
          </div>
        </div>
      )}

      {/* temporary toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-60 bg-neutral-800 text-sm text-white px-4 py-2 rounded shadow">
          {toast}
          <button className="ml-3 underline" onClick={() => setToast(null)}>
            Close
          </button>
        </div>
      )}
    </>
  );
}
