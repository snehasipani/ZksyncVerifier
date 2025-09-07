"use client";

import React, { useState } from "react";
import Timeline from "../components/Timeline"; // adjust if your path differs
import type { Proof } from "../components/types";

const ProofsPage: React.FC = () => {
  const [proofs] = useState<Proof[]>([
    {
      cid: "bafybeiexamplecid1",
      owner: "0x1234...abcd",
      proof: "0xaaa111...",
      ts: Math.floor(Date.now() / 1000) - 3600,
      title: "Sample Proof 1",
      description: "This is a sample proof for testing."
    },
    {
      cid: "bafybeiexamplecid2",
      owner: "0x5678...efgh",
      proof: "0xbbb222...",
      ts: Math.floor(Date.now() / 1000) - 7200,
      title: "Sample Proof 2",
      description: "Another example proof."
    }
  ]);

  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Proofs</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Browse all proofs created in the system. Click on a proof to see details.
      </p>
      <Timeline proofs={proofs} />
    </section>
  );
};

export default ProofsPage;
