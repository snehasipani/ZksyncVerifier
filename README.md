# ZkSync Verifier 🛡️✨  
**Prove your creativity without revealing it.**

---

## 🔍 Problem
- Proving authorship or originality of digital work (art, code, design, docs) is hard.  
- Existing methods rely on centralized platforms or exposing the entire file.  
- Content can be copied, timestamps forged, or intellectual property stolen.  
- On-chain storage of raw files is costly and leaks private data.  

---

## ✅ Solution — ZkSync Verifier
ZkSync Verifier lets creators **prove ownership of their creative work** on-chain in a **cheap, scalable, and privacy-preserving way**.

- Generate a **zero-knowledge proof** of authorship without revealing the full file.  
- Store only the **hash / IPFS CID** instead of the actual file.  
- Verify ownership instantly on **ZkSync Era L2** with minimal gas fees.  
- Optionally **mint an NFT** as a portable badge of creativity.  

👉 In short: **“Proof without disclosure — creativity you can trust.”**

---

## ✨ Features
- 📂 **File Uploader** → upload a creative work, store CID on IPFS.  
- 🔒 **Zero-Knowledge Proofs** → prove authorship without revealing the file.  
- ⛓️ **Smart Contracts** → `ProofOfCreativity.sol`, `ProofNFT.sol`, deployable via Hardhat.  
- 🖼️ **NFT Minting (optional)** → turn proofs into verifiable, portable NFTs.  
- 💻 **Client-Side Verifier** → verify zk-proofs in browser (`lib/verifier.ts`).  
- ⚡ **Cheap & Scalable** → runs on ZkSync Era (Ethereum L2).  
- 🧑‍⚖️ **Judge-Friendly Demo** → `/app/demo` route for quick interactive testing.  

---

## 🛠️ How It Works
1. **Upload** → File is hashed, CID stored on IPFS (not the raw file).  
2. **Prove** → A zk-SNARK proof is generated showing knowledge of the file/CID.  
3. **Verify** → Proof is verified on-chain or in browser using smart contracts + verifier lib.  
4. **Mint (optional)** → Proof can be turned into an NFT (`ProofNFT.sol`) as a badge.  
5. **Check** → Anyone can verify a proof in the `/app/proofs` UI.  

---

## 📂 Project Structure
