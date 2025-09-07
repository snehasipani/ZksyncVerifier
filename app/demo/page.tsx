"use client";

import React, { useEffect, useState } from "react";
import FileUploader from "../components/FileUploader";
import Timeline from "../components/Timeline";
import type { Proof } from "../components/types";
import { computeProof } from "../../lib/utils"; // adjust path if needed
import { saveAs } from "file-saver";

export default function DemoPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [selected, setSelected] = useState<Proof | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("proofs");
      if (raw) {
        const parsed = JSON.parse(raw) as Proof[];
        setProofs(parsed);
        if (parsed.length > 0) setSelected(parsed[0]);
      }
    } catch (e) {}
  }, []);

  // persist proofs
  useEffect(() => {
    try {
      localStorage.setItem("proofs", JSON.stringify(proofs ?? []));
    } catch (e) {}
  }, [proofs]);

  async function createProofObject(cid: string, file: File) {
    const title = file.name;
    const description = `Uploaded ${file.type} • ${Math.round(file.size / 1024)} KB`;
    const ts = Math.floor(Date.now() / 1000);

    try {
      const web3 = await import("../../lib/web3");
      if (web3?.storeProof) {
        const res = await web3.storeProof(cid);
        const owner = res?.owner ?? (await web3.getSignerAddress?.()) ?? "";
        const timestamp = res?.timestamp ?? ts;
        const proofHash = computeProof(cid, owner, timestamp);

        const newProof: Proof = {
          cid,
          owner,
          proof: proofHash,
          ts: timestamp,
          txHash: res?.txHash,
          title,
          description,
        };

        return newProof;
      }
    } catch (err) {
      // fallback
    }

    const mockOwnerAddr = "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "0");
    const proofHash = computeProof(cid, mockOwnerAddr, ts);
    return {
      cid,
      owner: mockOwnerAddr,
      proof: proofHash,
      ts,
      txHash: undefined,
      title,
      description,
    } as Proof;
  }

  async function onUploadCompleteAction({ cid, file }: { cid: string; file: File }) {
    setLoading(true);
    try {
      const p = await createProofObject(cid, file);
      setProofs((s) => [p, ...(s ?? [])]);
      setSelected(p);
    } catch (err) {
      console.error("demo upload error", err);
      alert("Error creating proof");
    } finally {
      setLoading(false);
    }
  }

  async function simulateOnChain(proof: Proof) {
    setLoading(true);
    try {
      if (proof.txHash) {
        alert("Already on-chain: " + proof.txHash);
        return;
      }

      try {
        const web3 = await import("../../lib/web3");
        if (web3?.storeProof) {
          const res = await web3.storeProof(proof.cid);
          const owner = res?.owner ?? proof.owner;
          const timestamp = res?.timestamp ?? proof.ts;
          const proofHash = computeProof(proof.cid, owner, timestamp);

          const updated: Proof = {
            ...proof,
            owner,
            ts: timestamp,
            proof: proofHash,
            txHash: res?.txHash,
          };

          setProofs((s) => [updated, ...(s ?? []).filter((p) => p.proof !== proof.proof)]);
          setSelected(updated);
          alert("Stored on-chain: " + (res?.txHash ?? "unknown"));
          return;
        }
      } catch (err) {
        // fallback
      }

      const fakeTx = "0x" + Math.random().toString(16).slice(2, 66).padEnd(64, "0");
      const updatedMock: Proof = { ...proof, txHash: fakeTx };
      setProofs((s) => [updatedMock, ...(s ?? []).filter((p) => p.proof !== proof.proof)]);
      setSelected(updatedMock);
      alert("Simulated on-chain tx: " + fakeTx);
    } finally {
      setLoading(false);
    }
  }

  function verifyLocally(proof: Proof) {
    const recomputed = computeProof(proof.cid, proof.owner, proof.ts);
    const ok = recomputed === proof.proof;
    alert(ok ? "Local verification OK ✅" : "Local verification FAILED ❌");
  }

  function downloadProofJson(proof: Proof) {
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
    saveAs(blob, `zkproof-${(proof.proof ?? "").slice(2, 10)}.json`);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-3">Demo — Judges Quick Flow</h1>
      <p className="text-sm text-neutral-400 mb-4 max-w-2xl">
        Quick interactive demo: upload a file, optionally simulate storing the proof on-chain,
        verify locally, and download a portable proof JSON.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="mb-4">
            <FileUploader onUploadCompleteAction={onUploadCompleteAction as any} accept="image/*,application/pdf,text/*,application/zip" />
          </div>

          <div className="bg-neutral-800 p-4 rounded">
            <h3 className="text-sm font-semibold mb-2">Selected proof</h3>
            {selected ? (
              <div className="space-y-3">
                <div className="text-sm text-neutral-300"><strong>Title:</strong> {selected.title}</div>
                <div className="text-xs text-neutral-400"><strong>CID:</strong> {selected.cid}</div>
                <div className="text-xs text-neutral-400"><strong>Owner:</strong> {selected.owner}</div>
                <div className="text-xs text-neutral-400"><strong>Proof:</strong> <span className="break-all">{selected.proof}</span></div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => simulateOnChain(selected)} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-sm" disabled={loading}>
                    {selected.txHash ? "On-chain" : "Store on-chain"}
                  </button>
                  <button onClick={() => verifyLocally(selected)} className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">
                    Verify locally
                  </button>
                  <button onClick={() => downloadProofJson(selected)} className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-sm">
                    Download JSON
                  </button>
                </div>
                {selected.txHash && (
                  <div className="text-xs text-neutral-400 mt-2">
                    Tx: <a href={`https://explorer.zksync.io/tx/${selected.txHash}`} target="_blank" rel="noreferrer" className="text-indigo-400">{selected.txHash}</a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-neutral-400">No proof selected — upload a file to start.</div>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Timeline</h3>
        <Timeline
  proofs={proofs}
  onSelect={(p: Proof) => {
    setSelected(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
  highlighted={selected?.proof ?? null}
/>

          </div>
        </div>

        <aside className="bg-neutral-800 p-4 rounded">
          <h3 className="text-sm font-semibold mb-2">Quick guide for judges</h3>
          <ol className="text-xs text-neutral-400 list-decimal list-inside space-y-2">
            <li>Upload a file using the uploader (or use the sample button on the homepage).</li>
            <li>Click <strong>Store on-chain</strong> to simulate or call the real contract (if connected).</li>
            <li>Click <strong>Verify locally</strong> to recompute the proof hash and ensure it matches.</li>
            <li>Download the proof JSON and keep it as a portable certificate.</li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
