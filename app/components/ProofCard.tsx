// components/ProofCard.tsx
"use client";

import React, { useState } from "react";

export type Proof = {
  id?: string;
  cid: string;
  owner: string;
  proof: string;
  ts: number;
  txHash?: string;
  title?: string;
  description?: string;
};

// helper: returns just the CID token or null
function extractCidToken(raw?: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();

  if (s.startsWith("http://") || s.startsWith("https://")) {
    const idx = s.indexOf("/ipfs/");
    if (idx !== -1) {
      s = s.slice(idx + "/ipfs/".length);
    } else {
      try {
        const url = new URL(s);
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length) s = parts[parts.length - 1];
      } catch {
        // noop
      }
    }
  }

  if (s.startsWith("ipfs://")) {
    s = s.replace(/^ipfs:\/\//, "").replace(/^\/+/, "");
  }

  const ipfsIndex = s.indexOf("/ipfs/");
  if (ipfsIndex !== -1) {
    s = s.slice(ipfsIndex + "/ipfs/".length);
  }

  s = s.split(/[/?#]/)[0].trim();

  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{52,})$/i.test(s)) return s;
  if (/^[A-Za-z0-9]+$/.test(s) && s.length > 20 && s.length < 128) return s;

  return null;
}

function makeGatewayUrlsFromCidToken(cidToken: string | null) {
  if (!cidToken) return [];
  return [`https://ipfs.io/ipfs/${cidToken}`, `https://dweb.link/ipfs/${cidToken}`];
}

type ProofCardProps = {
  proof: Proof;
  highlighted?: boolean;
  onRevealAction?: (proof: Proof) => void;
  onShareAction?: (payload: Record<string, any>) => void;
};

export default function ProofCard({
  proof,
  highlighted = false,
  onRevealAction,
  onShareAction,
}: ProofCardProps) {
  const cidToken = extractCidToken(proof.cid);
  const gatewayUrls = makeGatewayUrlsFromCidToken(cidToken);
  const explorerTx = proof.txHash ? `https://explorer.zksync.io/tx/${proof.txHash}` : null;

  const [copied, setCopied] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  function formattedTime(ts?: number) {
    if (!ts) return "-";
    return new Date(ts * 1000).toLocaleString();
  }

  function downloadProofJson() {
    const payload = {
      cid: proof.cid,
      owner: proof.owner,
      proof: proof.proof,
      ts: proof.ts,
      txHash: proof.txHash,
      title: proof.title,
      description: proof.description,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zkproof-${(proof.proof ?? "").slice(2, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (onShareAction) onShareAction(payload);
  }

  async function copyToClipboard(text: string, label = "copied") {
    if (!text) {
      setCopied("nothing to copy");
      setTimeout(() => setCopied(null), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("copy failed", err);
      setCopied("failed");
      setTimeout(() => setCopied(null), 2000);
    }
  }

  function handleReveal() {
    setShowReveal((s) => !s);
    if (onRevealAction) onRevealAction(proof);
  }

  async function openBestGatewayOrFallback() {
    if (!cidToken) {
      if (proof.cid) {
        copyToClipboard(proof.cid, "CID copied");
      } else {
        setCopied("no cid");
        setTimeout(() => setCopied(null), 2000);
      }
      return;
    }

    for (const url of gatewayUrls) {
      try {
        const resp = await fetch(url, { method: "HEAD" });
        if (resp.ok) {
          window.open(url, "_blank");
          return;
        }
      } catch (err) {
        console.warn("fetch check failed (CORS/network) for", url, err);
        window.open(gatewayUrls[0], "_blank");
        return;
      }
    }

    window.open(gatewayUrls[0], "_blank");
  }

  function handleShareWeb() {
    const payload = {
      cid: proof.cid,
      owner: proof.owner,
      proof: proof.proof,
      ts: proof.ts,
      txHash: proof.txHash,
      title: proof.title,
      description: proof.description,
      url: gatewayUrls[0] ?? null,
      explorer: explorerTx,
    };
    if (navigator.share) {
      navigator
        .share({
          title: proof.title || "zkProof",
          text: proof.description || "zkProof of Creativity",
          url: gatewayUrls[0] ?? explorerTx ?? window.location.href,
        })
        .catch(() => {
          downloadProofJson();
        });
    } else {
      if (onShareAction) {
        onShareAction(payload);
      } else {
        downloadProofJson();
      }
    }
  }

  const baseClass = "rounded p-4 flex flex-col gap-3 border ";
  const highlightedClass = highlighted
    ? "bg-neutral-700 border-indigo-500 shadow-md ring-2 ring-indigo-600"
    : "bg-neutral-800 border-neutral-700";

  return (
    <div className={baseClass + highlightedClass}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-medium">
            {proof.title ?? (proof.cid ? proof.cid.slice(0, 24) : "untitled")}
          </div>
          <div className="text-xs text-neutral-400 break-all">{proof.description}</div>
        </div>

        <div className="text-xs text-neutral-400 text-right">
          <div>{formattedTime(proof.ts)}</div>
          <div className="mt-1">
            {proof.txHash ? <span className="text-emerald-400">On-chain</span> : <span className="text-yellow-400">Local</span>}
          </div>
          <div className="mt-2 text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openBestGatewayOrFallback();
              }}
              className="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-xs"
            >
              Open IPFS
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReveal();
          }}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600"
        >
          {showReveal ? "Hide CID" : "Reveal CID"}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShareWeb();
          }}
          className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500"
        >
          Share
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadProofJson();
          }}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600"
        >
          Download
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(proof.proof, "proof copied");
          }}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600"
        >
          Copy proof
        </button>

        {copied && <div className="ml-2 text-xs text-green-400">{copied}</div>}
      </div>

      {showReveal && (
        <div className="mt-2 p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400 mb-2">CID</div>
          <div className="flex items-center gap-2">
            <div className="text-sm break-all">{proof.cid || "—"}</div>
            <div className="flex gap-2 ml-auto">
              {proof.cid && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(proof.cid, "CID copied");
                    }}
                    className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600"
                  >
                    Copy CID
                  </button>

                  {cidToken && (
                    <a
                      onClick={(e) => e.stopPropagation()}
                      href={gatewayUrls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500"
                    >
                      Open
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
          {!cidToken && <div className="mt-2 text-xs text-yellow-400">CID appears invalid — copied raw value when you click "Copy CID".</div>}
        </div>
      )}
    </div>
  );
}
