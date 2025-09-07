// lib/utils.ts
import { keccak256, solidityPacked, getAddress as normalizeAddress } from "ethers";

/**
 * Compute a deterministic proof hash from CID + owner + timestamp.
 * Equivalent to Solidity keccak256(abi.encodePacked(cid, owner, ts)).
 * Validates the owner address and throws a clear error if invalid.
 */
export function computeProof(cid: string, owner: string, ts: number): string {
  let normalizedOwner: string;
  try {
    normalizedOwner = normalizeAddress(owner);
  } catch {
    throw new Error(
      `Invalid owner address passed to computeProof: "${owner}". 
       Pass a valid Ethereum address (e.g. from signer.getAddress()).`
    );
  }

  return keccak256(
    solidityPacked(["string", "address", "uint256"], [cid, normalizedOwner, ts])
  );
}

/**
 * Shorten an Ethereum address for display.
 */
export function shortAddress(addr: string, chars = 4): string {
  return addr
    ? addr.slice(0, 2 + chars) + "…" + addr.slice(-chars)
    : "";
}

/**
 * Format a unix timestamp to a human-readable date string.
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

/**
 * Sleep helper (ms).
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
