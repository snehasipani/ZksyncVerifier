// app/components/Header.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWeb3 } from "./Web3Provider";

function shortAddr(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function chainName(chainId?: number | null) {
  switch (chainId) {
    case 1:
      return "Ethereum";
    case 5:
      return "Goerli";
    case 11155111:
      return "Sepolia";
    case 280:
      return "zkSync Era";
    case 324:
      return "zkSync Mainnet";
    default:
      return chainId ? `chain ${chainId}` : "unknown";
  }
}

export default function Header() {
  const { address, chainId, connect, disconnect, connecting } = useWeb3();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [copied, setCopied] = useState<null | "addr">(null);

  // friendly connect message (shows when user rejects or no injected wallet)
  const [connectMsg, setConnectMsg] = useState<string | null>(null);

  // DEBUG: print provider / UA info when header mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // logs visible in browser DevTools Console
        console.log("window.ethereum", !!(window as any).ethereum);
        console.log("window.ethereum.selectedAddress", (window as any).ethereum?.selectedAddress);
        console.log("navigator.userAgent", navigator.userAgent);
      } catch (e) {
        // swallow any console errors in odd environments
        console.warn("Header debug logging failed", e);
      }
    }
  }, []);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied("addr");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  // Wrapper to call connect() and interpret result.
  // connect() should return normalized address on success, or null on rejection/failure.
  async function handleConnectClick() {
    setConnectMsg(null);

    // call connect (must be invoked from a user gesture)
    const result = await connect();

    if (result) {
      // connected
      setConnectMsg(null);
      return;
    }

    // Not connected: either user rejected popup or no injected provider.
    const hasInjected = typeof window !== "undefined" && !!(window as any).ethereum;

    if (!hasInjected) {
      setConnectMsg(
        "No injected wallet found. For mobile, open this page in the MetaMask app browser, or use the Connect chooser."
      );
      // Optionally open your chooser modal here if you have one
      return;
    }

    // If there is an injected provider but connect returned null => likely user rejected the popup
    setConnectMsg("Connection request rejected. Click Connect to try again.");
  }

  return (
    <header className="w-full bg-neutral-900 border-b border-neutral-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Brand + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-white hover:text-indigo-400">
            zkProof of Creativity
          </Link>

          <nav className="hidden md:flex gap-4 text-sm text-neutral-400">
            <Link href="/proofs" className="hover:text-white">Timeline</Link>
            <Link href="/demo" className="hover:text-white">Demo</Link>
          </nav>

          {/* mobile menu button */}
          <button
            className="md:hidden p-2 rounded hover:bg-neutral-800 text-neutral-300"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((s) => !s)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Right: Wallet area */}
        <div className="flex items-center gap-3">
          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-neutral-800">
                <div className="text-sm font-medium">{shortAddr(address)}</div>
                <div className="text-xs text-neutral-400 px-2 py-0.5 rounded bg-neutral-900">{chainName(chainId)}</div>
              </div>

              {/* action dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActionsOpen((s) => !s)}
                  aria-haspopup="true"
                  aria-expanded={actionsOpen}
                  className="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-xs"
                >
                  Actions
                </button>

                {actionsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-20 py-2"
                    role="menu"
                  >
                    <button
                      onClick={copyAddress}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-700"
                      role="menuitem"
                    >
                      {copied === "addr" ? "Copied address" : "Copy address"}
                    </button>

                    <a
                      href={`https://explorer.zksync.io/address/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3 py-2 text-sm hover:bg-neutral-700"
                      role="menuitem"
                    >
                      View on explorer
                    </a>

                    <button
                      onClick={() => { disconnect(); setActionsOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-neutral-700"
                      role="menuitem"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleConnectClick}
                disabled={connecting}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
                aria-busy={connecting}
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>

              {connectMsg && (
                <div className="mt-2 text-sm text-red-400 max-w-xs">
                  {connectMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden mt-2 px-4 pb-3">
          <nav className="flex flex-col gap-2 text-sm text-neutral-300">
            <Link href="/proofs" className="block py-2 px-2 rounded hover:bg-neutral-800">Timeline</Link>
            <Link href="/demo" className="block py-2 px-2 rounded hover:bg-neutral-800">Demo</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
