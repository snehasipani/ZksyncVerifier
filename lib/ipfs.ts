// lib/ipfs.ts
import { Web3Storage } from "web3.storage";

/**
 * Get a Web3.Storage client. Expects NEXT_PUBLIC_WEB3_STORAGE_TOKEN to be set.
 * Throws if token is missing.
 */
function getClient(): Web3Storage {
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  if (!token) {
    throw new Error("Missing NEXT_PUBLIC_WEB3_STORAGE_TOKEN env var");
  }
  return new Web3Storage({ token });
}

/**
 * Upload a single File to IPFS via Web3.Storage.
 * Returns the CID string.
 */
export async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const client = getClient();

  let uploaded = 0;
  const total = file.size || 0;

  const onStoredChunk = (size: number) => {
    uploaded += size;
    if (total > 0 && typeof onProgress === "function") {
      const p = Math.min(1, uploaded / total);
      try { onProgress(p); } catch {}
    }
  };

  const cid = await client.put([file], { wrapWithDirectory: false, onStoredChunk });
  if (typeof onProgress === "function") {
    try { onProgress(1); } catch {}
  }
  console.log("uploaded cid:", cid);
  return cid;
}

/**
 * Upload multiple files and return the root CID.
 */
export async function uploadToIPFS(files: File[], onProgress?: (progress: number) => void): Promise<string> {
  const client = getClient();

  const total = files.reduce((s, f) => s + (f.size || 0), 0);
  let uploaded = 0;

  const onStoredChunk = (size: number) => {
    uploaded += size;
    if (total > 0 && typeof onProgress === "function") {
      const p = Math.min(1, uploaded / total);
      try { onProgress(p); } catch {}
    }
  };

  const cid = await client.put(files, { wrapWithDirectory: false, onStoredChunk });
  if (typeof onProgress === "function") {
    try { onProgress(1); } catch {}
  }
  console.log("uploaded cid:", cid);
  return cid;
}

/**
 * Fetch JSON or text from IPFS via a public gateway.
 */
export async function fetchFromIPFS<T = any>(cid: string, path = ""): Promise<T> {
  const gateway = ipfsGatewayUrl(cid, path);
  const res = await fetch(gateway);
  if (!res.ok) throw new Error(`Failed to fetch from IPFS: ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

/**
 * Build a gateway URL for preview.
 */
export function ipfsGatewayUrl(cid: string, path = ""): string {
  return `https://ipfs.io/ipfs/${cid}${path ? `/${path}` : ""}`;
}

/**
 * returns just the cid token (or null) by stripping ipfs://, /ipfs/... and removing trailing path/query
 */
export function extractCidToken(raw?: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();

  // full http(s) — try to extract after /ipfs/
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
        // leave s as-is
      }
    }
  }

  // ipfs:// or ipfs://ipfs/
  if (s.startsWith("ipfs://")) {
    s = s.replace(/^ipfs:\/\//, "").replace(/^\/+/, "");
  }

  // strip leading /ipfs/
  const ipfsIndex = s.indexOf("/ipfs/");
  if (ipfsIndex !== -1) {
    s = s.slice(ipfsIndex + "/ipfs/".length);
  }

  // remove any trailing path or query after the CID token
  s = s.split(/[/?#]/)[0];

  // remove whitespace
  s = s.trim();

  // basic CID validation: supports CIDv0 (Qm...) and CIDv1 base32 (bafy...)
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{40,})$/i.test(s)) {
    return s;
  }

  // if it doesn't match strict regex but looks like no spaces and reasonable length, still return (len 20-128)
  if (/^[A-Za-z0-9]+$/.test(s) && s.length > 20 && s.length < 128) {
    return s;
  }

  return null;
}

/**
 * Build standard gateway URLs (we always use just the CID token)
 */
export function makeGatewayUrlsFromCidToken(cidToken: string | null) {
  if (!cidToken) return [];
  const gateways = [
    `https://ipfs.io/ipfs/${cidToken}`,
    `https://dweb.link/ipfs/${cidToken}`,
  ];
  return gateways;
}
