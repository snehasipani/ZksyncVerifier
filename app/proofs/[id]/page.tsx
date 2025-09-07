"use client";

import React from "react";
import { useParams } from "next/navigation";
import ProofCard, { Proof } from "../../components/ProofCard";

export default function ProofDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Normally you'd fetch proof details using `id` (proof hash or CID)
  const proof: Proof = {
    cid: "bafybeiexamplecid1",
    owner: "0x1234...abcd",
    proof: id || "0xaaa111...",
    ts: Math.floor(Date.now() / 1000) - 3600,
    title: "Sample Proof 1",
    description: "Detailed proof view loaded by ID."
  };

  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold mb-4">Proof Details</h1>
      <div className="bg-neutral-800 p-4 rounded">
        <ProofCard proof={proof} />
      </div>
    </section>
  );
}
