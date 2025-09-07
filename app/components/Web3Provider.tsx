// app/components/Web3Provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Signer } from "ethers";
import { BrowserProvider, JsonRpcProvider, getAddress, type Network } from "ethers";

type Web3ContextState = {
  provider: BrowserProvider | null;
  signer: Signer | null;
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  signMessage: (msg: string) => Promise<string>;
  getProviderOrFallback: () => JsonRpcProvider | BrowserProvider | null;
};

const Web3Context = createContext<Web3ContextState | undefined>(undefined);

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Helper: extract address whether accounts entry is string or signer-like
  async function accountEntryToAddress(entry: unknown): Promise<string | null> {
    if (!entry) return null;
    if (typeof entry === "string") return entry;
    // signer-like object (JsonRpcSigner)
    if (typeof (entry as any).getAddress === "function") {
      try {
        return await (entry as any).getAddress();
      } catch {
        return null;
      }
    }
    return null;
  }

  // Initialize if provider already injected (e.g., MetaMask)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const eth = (window as any).ethereum;
    if (!eth) return;

    const p = new BrowserProvider(eth);
    setProvider(p);

    // If the user already authorized the site, set address
    p.listAccounts()
      .then(async (accounts) => {
        if (accounts && accounts[0]) {
          const maybeAddr = await accountEntryToAddress(accounts[0]);
          if (maybeAddr) {
            const addr = getAddress(maybeAddr);
            setAddress(addr);
            // getSigner() returns a Promise<JsonRpcSigner> in v6
            try {
              const s = await p.getSigner();
              setSigner(s);
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => {});

    p.getNetwork()
      .then((n: Network) => {
        // chainId may be bigint in v6; convert to number
        setChainId(typeof (n.chainId) === "bigint" ? Number(n.chainId) : (n.chainId as number));
      })
      .catch(() => {});

    const handleAccountsChanged = async (accounts: unknown) => {
      // EIP-1193 typically sends string[] on accountsChanged, but handle both shapes
      if (!accounts) {
        setAddress(null);
        setSigner(null);
        return;
      }

      // accounts might be an array
      const first = Array.isArray(accounts) ? (accounts as any)[0] : accounts;
      const maybeAddr = await accountEntryToAddress(first);
      if (!maybeAddr) {
        setAddress(null);
        setSigner(null);
      } else {
        const addr = getAddress(maybeAddr);
        setAddress(addr);
        try {
          const s = await p.getSigner();
          setSigner(s);
        } catch {
          // ignore
        }
      }
    };

    const handleChainChanged = (chainHex: string) => {
      try {
        const c = parseInt(chainHex, 16);
        setChainId(c);
      } catch {
        setChainId(null);
      }
    };

    eth.on?.("accountsChanged", handleAccountsChanged as any);
    eth.on?.("chainChanged", handleChainChanged as any);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged as any);
      eth.removeListener?.("chainChanged", handleChainChanged as any);
    };
  }, []);

  // connect: triggers injected provider popup (MetaMask)
  async function connect(): Promise<string | null> {
    if (typeof window === "undefined") {
      return null;
    }

    // debug logs (will print in browser console)
    if (typeof window !== "undefined") {
      console.log("userAgent:", navigator.userAgent);
      console.log("window.ethereum present?", !!(window as any).ethereum);
      console.log("isMetaMask?", !!(window as any).ethereum?.isMetaMask);
    }

    const eth = (window as any).ethereum;
    if (!eth) {
      // no injected provider available
      return null;
    }

    // Prevent concurrent connects
    if (connecting) return null;
    setConnecting(true);

    try {
      // This must be called from a user gesture (button click)
      await eth.request?.({ method: "eth_requestAccounts" });

      // Wrap into ethers provider & signer
      const p = new BrowserProvider(eth);
      const s = await p.getSigner();
      const addr = await s.getAddress();

      // Persist context
      setProvider(p);
      setSigner(s);
      const normalized = getAddress(addr);
      setAddress(normalized);

      const network = await p.getNetwork();
      setChainId(typeof network.chainId === "bigint" ? Number(network.chainId) : (network.chainId as number));

      return normalized;
    } catch (err: any) {
      // ethers wraps provider rejections — detect user rejection (4001)
      const code = err?.error?.code ?? err?.code ?? null;
      const msg = err?.message ?? String(err);

      if (code === 4001 || /user rejected/i.test(msg)) {
        // user intentionally rejected the popup — return null and do not throw
        return null;
      }

      // other unexpected errors: log and return null
      console.error("connect error", err);
      return null;
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    // Note: MetaMask doesn't support programmatic disconnect; we just clear our state
    setAddress(null);
    setSigner(null);
    // keep provider reference (in case they reconnect in same page)
  }

  async function signMessage(msg: string) {
    if (!signer) throw new Error("No signer available");
    return signer.signMessage(msg);
  }

  function getProviderOrFallback() {
    if (provider) return provider;
    // fallback to public zkSync RPC if configured
    const rpc = process.env.NEXT_PUBLIC_ZKSYNC_RPC;
    if (rpc) {
      return new JsonRpcProvider(rpc);
    }
    return null;
  }

  const value: Web3ContextState = {
    provider,
    signer,
    address,
    chainId,
    connecting,
    connect,
    disconnect,
    signMessage,
    getProviderOrFallback,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
