// lib/web3.ts
import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
  getAddress,
  parseUnits,
  formatUnits,
  type Provider,
} from "ethers";

import ProofOfCreativityArtifact from "../artifacts/contracts/ProofOfCreativity.sol/ProofOfCreativity.json";
import ProofNFTArtifact from "../artifacts/contracts/ProofNFT.sol/ProofNFT.json";

// ---- Helpers ----

function normalizeAbiInput(abiInput: any): any[] | null {
  // Accept common shapes:
  //  - raw ABI array
  //  - artifact object { abi: [...] }
  //  - ESM wrapper { default: [...] }
  if (!abiInput) return null;
  if (Array.isArray(abiInput)) return abiInput;
  if (abiInput.abi && Array.isArray(abiInput.abi)) return abiInput.abi;
  if (abiInput.default && Array.isArray(abiInput.default)) return abiInput.default;
  return null;
}

// Browser provider (MetaMask etc.)
export function getBrowserProvider(): BrowserProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  return new BrowserProvider(eth);
}

// Fallback provider
export function getProviderOrFallback(): Provider | null {
  const browser = getBrowserProvider();
  if (browser) return browser;

  const rpc =
    typeof window !== "undefined"
      ? (window as any)?.__FALLBACK_RPC
      : process.env.NEXT_PUBLIC_ZKSYNC_RPC;
  if (!rpc) return null;

  return new JsonRpcProvider(rpc);
}

// Return signer if available
export async function getSigner() {
  const browser = getBrowserProvider();
  if (!browser) return null;
  try {
    return await browser.getSigner();
  } catch {
    return null;
  }
}

// New helper for address
export async function getSignerAddress(): Promise<string | null> {
  const signer = await getSigner();
  if (!signer) return null;
  return signer.getAddress();
}

export function normalizeAddress(addr: string): string {
  return getAddress(addr);
}

export async function getContract<T = Contract>(
  address: string,
  abiInput: any,
  opts?: { signer?: any; provider?: Provider }
): Promise<T> {
  const provider = opts?.provider ?? getProviderOrFallback();
  if (!provider) throw new Error("No provider available to create contract");

  const abi = normalizeAbiInput(abiInput);
  if (!abi) {
    console.error("Invalid ABI passed to getContract:", abiInput);
    throw new Error("Invalid ABI passed to getContract — expected ABI array or artifact with .abi");
  }

  const normalized = normalizeAddress(address);
  const signer = opts?.signer ?? (await getSigner());
  const instance = new Contract(normalized, abi, (signer ?? provider) as any) as T;
  return instance;
}

export function parseEther(amount: string): bigint {
  return parseUnits(amount, 18);
}

export function formatEther(amount: bigint | string): string {
  return formatUnits(amount as any, 18);
}

// ---- Contract calls ----

export async function storeProof(cid: string): Promise<{
  txHash: string;
  owner: string;
  timestamp: number;
}> {
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available — connect wallet first");

  const contractAddr = process.env.NEXT_PUBLIC_PROOF_CONTRACT;
  if (!contractAddr) throw new Error("NEXT_PUBLIC_PROOF_CONTRACT not set in .env");

  // Pass artifact (or artifact.abi) — helper will normalize
  const contract = await getContract(contractAddr, ProofOfCreativityArtifact, { signer });
  if (!contract) throw new Error("Contract instance could not be created");

  const tx = await (contract as any).storeProof(cid);
  const receipt = await tx.wait();

  const owner = await signer.getAddress();

  // Use a provider (browser provider or fallback) to fetch the block for timestamp
  const provider = getProviderOrFallback();
  const block = provider ? await provider.getBlock(receipt.blockNumber) : null;
  const timestamp = block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);

  return {
    txHash: receipt.hash,
    owner,
    timestamp,
  };
}

export async function mintProofNFT(metadataURI: string): Promise<string> {
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available — connect wallet first");

  const contractAddr = process.env.NEXT_PUBLIC_PROOFNFT_CONTRACT;
  if (!contractAddr) throw new Error("NEXT_PUBLIC_PROOFNFT_CONTRACT not set in .env");

  const contract = await getContract(contractAddr, ProofNFTArtifact, { signer });
  if (!contract) throw new Error("NFT contract instance could not be created");

  const owner = await signer.getAddress();
  const tx = await (contract as any).mint(owner, metadataURI);
  const receipt = await tx.wait();

  return receipt.hash;
}
