// components/types.ts
export type Proof = {
  cid: string;
  owner: string;
  proof: string;
  ts: number;
  txHash?: string;
  title?: string;
  description?: string;
};
export type ProofCardProps = { proof: Proof; onView?: (p: Proof) => void };
