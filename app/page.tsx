"use client";

import React, { useEffect, useState } from "react";
import FileUploader from "./components/FileUploader";
import Timeline from "./components/Timeline";
// import MintButton from "./components/MintButton";
import type { Proof } from "./components/ProofCard";
import { computeProof } from "../lib/utils";

type UploadResult = {
  cid: string;
  fileName?: string;
};

export default function HomePage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<string | undefined>(undefined);

  // If you implement a server-side DB or event reader, you can call it here to seed proofs
  useEffect(() => {
    // Optional: load persisted proofs from localStorage for demo
    const saved = typeof window !== "undefined" ? localStorage.getItem("zk_proofs") : null;
    if (saved) {
      try {
        setProofs(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    // persist locally for demo purposes
    try {
      localStorage.setItem("zk_proofs", JSON.stringify(proofs));
    } catch {}
  }, [proofs]);

  // Handler invoked by FileUploader component
  async function handleUploadComplete(cid: string, file: File) {
    // title/description could be collected from a form UI — keep minimal here
    const title = file.name;
    const description = `Uploaded ${file.type} • ${Math.round(file.size / 1024)} KB`;

    // timestamp (seconds)
    const ts = Math.floor(Date.now() / 1000);

    setLoading(true);
    try {
      // 1) compute proof locally
      //    computeProof should be in lib/utils.ts and return ethers.utils.keccak256(...)
      //    computeProof(cid, ownerAddress, ts) — but owner not available until signer is present.
      // We will get signer address during contract call, so compute proof after storeProof returns owner and ts.
      // 2) call web3.storeProof(cid) which should send tx from connected wallet and return tx hash + owner address + timestamp
      let web3: any = null;
      try {
        web3 = await import("../lib/web3");
      } catch (err) {
        console.warn("lib/web3 not found — falling back to mock:", err);
      }

      // If web3.storeProof is implemented, call it. Otherwise simulate.
      if (web3?.storeProof) {
        // storeProof should call contract.storeProof(cid) and return { txHash, owner, timestamp }
        const res = await web3.storeProof(cid);
        const owner = res.owner || res.from || (await web3.getSignerAddress?.());
        const timestamp = res.timestamp || ts;
        const proofHash = computeProof(cid, owner, timestamp);

        const newProof: Proof = {
          cid,
          owner,
          proof: proofHash,
          ts: timestamp,
          txHash: res.txHash,
          title,
          description,
        };

        setProofs((p) => [newProof, ...p]);
        setLastTx(res.txHash);
      } else {
        // MOCK flow for demo without contract:
        const mockOwner = (window as any).ethereum
          ? (await (await import("ethers")).getDefaultProvider()) && undefined
          : "0x0000000000000000000000000000000000000000";
        const mockOwnerAddr = "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "0");
        const proofHash = computeProof(cid, mockOwnerAddr, ts);
        const newProof: Proof = {
          cid,
          owner: mockOwnerAddr,
          proof: proofHash,
          ts,
          txHash: undefined,
          title,
          description,
        };
        setProofs((p) => [newProof, ...p]);
      }
    } catch (err) {
      console.error("Upload flow error", err);
      alert("An error occurred during proof creation.");
    } finally {
      setLoading(false);
    }
  }

  // Optional mint handler (used by MintButton). You should implement lib/web3.mintProofNFT
  async function handleMint(metadataURI: string) {
    try {
      const web3 = await import("../lib/web3");
      if (!web3?.mintProofNFT) {
        alert("mint handler not implemented (lib/web3.mintProofNFT missing)");
        return "";
      }
      const txHash = await web3.mintProofNFT(metadataURI);
      return txHash;
    } catch (err) {
      console.error("mint error", err);
      throw err;
    }
  }

  return (
    <div className="w-full">
      <section className="mb-6">
        <h1 className="text-3xl font-bold">zkProof of Creativity</h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-2xl">
          Upload your artwork, code, or design — store it on IPFS and record a cheap proof on zkSync so
          you can prove authorship later.
        </p>
      </section>

      <section className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
         
   <FileUploader
  onUploadCompleteAction={async ({ cid, file }) => {
    await handleUploadComplete(cid, file);
  }}
/>


          </div>

          <div className="w-full md:w-72">
            <div className="bg-neutral-800 p-4 rounded">
              <h3 className="text-sm font-semibold mb-2">Quick actions</h3>
              <div className="flex flex-col gap-2">
            <button
  onClick={async () => {
    const web3 = await import("../lib/web3");
    const owner = (await web3.getSignerAddress()) 
      ?? "0x0000000000000000000000000000000000000000"; // fallback zero address

    const ts = Math.floor(Date.now() / 1000);
    const proofHash = computeProof("bafybeiexamplesamplecid", owner, ts);

    const sample: Proof = {
      cid: "bafybeiexamplesamplecid",
      owner,
      proof: proofHash,
      ts,
      txHash: undefined,
      title: "Demo Sample",
      description: "Sample proof to preview UI"
    };

    setProofs((p) => [sample, ...p]);
  }}
  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
>
  Add demo proof
</button>

{/* 
                <MintButton
                  onMint={async (metadataURI: string) => {
                    const tx = await handleMint(metadataURI);
                    alert("Mint tx: " + tx);
                    return tx;
                  }}
                /> */}
              </div>
              {loading && <div className="mt-3 text-sm text-neutral-400">Processing…</div>}
              {lastTx && (
                <div className="mt-3 text-xs">
                  Last tx: <a className="text-indigo-400" href={`https://explorer.zksync.io/tx/${lastTx}`} target="_blank" rel="noreferrer">{lastTx}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Timeline</h2>
        <Timeline proofs={proofs} />
      </section>
    </div>
  );
}
