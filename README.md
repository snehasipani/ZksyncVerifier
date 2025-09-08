ZkSync Verifier 🛡️✨

Prove your creativity without revealing it.

🔍 Problem

Proving authorship or originality of digital work (art, code, design, docs) is hard.

Existing methods rely on centralized platforms or exposing the entire file.

Content can be copied, timestamps forged, or intellectual property stolen.

On-chain storage of raw files is costly and leaks private data.

✅ Solution — ZkSync Verifier

ZkSync Verifier lets creators prove ownership of their creative work on-chain in a cheap, scalable, and privacy-preserving way.

Generate a zero-knowledge proof of authorship without revealing the full file.

Store only the hash / IPFS CID instead of the actual file.

Verify ownership instantly on ZkSync Era L2 with minimal gas fees.

Optionally mint an NFT as a portable badge of creativity.

👉 In short: “Proof without disclosure — creativity you can trust.”

🔗 Live Demo

Project live on Vercel: https://zkproof-of-creativity.vercel.app/

✨ Features

📂 File Uploader → upload a creative work, store CID on IPFS.

🔒 Zero-Knowledge Proofs → prove authorship without revealing the file.

⛓️ Smart Contracts → ProofOfCreativity.sol, ProofNFT.sol, deployable via Hardhat.

🖼️ NFT Minting (optional) → turn proofs into verifiable, portable NFTs.

💻 Client-Side Verifier → verify zk-proofs in browser (lib/verifier.ts).

⚡ Cheap & Scalable → runs on ZkSync Era (Ethereum L2).

🧑‍⚖️ Judge-Friendly Demo → /app/demo route for quick interactive testing.

🛠️ How It Works

Upload → File is hashed, CID stored on IPFS (not the raw file).

Prove → A zk-SNARK proof is generated showing knowledge of the file/CID.

Verify → Proof is verified on-chain or in browser using smart contracts + verifier lib.

Mint (optional) → Proof can be turned into an NFT (ProofNFT.sol) as a badge.

Check → Anyone can verify a proof in the /app/proofs UI.

📂 Project Structure
zkproof-of-creativity/
│
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── proofs/page.tsx
│   ├── proofs/[id]/page.tsx
│   ├── demo/                    # small interactive demo route for judges
│   │   └── page.tsx
│   └── ...
├── contracts/
│   ├── ProofOfCreativity.sol
│   └── ProofNFT.sol
├── lib/
│   └── verifier.ts              # client-side verifier for zk-proofs
├── scripts/
│   └── deploy.ts                # hardhat deployment scripts
├── hardhat.config.cjs
├── package.json
└── README.md
🚀 Quickstart

npm install

Configure .env with your pinning service API key (e.g., web3.storage or Pinata) if you want user uploads pinned.

npm run dev to run the demo locally.

Use Hardhat to deploy contracts: npx hardhat run --network zksync scripts/deploy.ts (adjust network config).

🙋‍♀️ Notes & Recommendations

For demo/hackathon use, web3.storage offers a simple free tier (1GB) and is recommended for quick onboarding.

Never store pinning API keys in frontend code — keep them in server-side env or use a proxy.

The /app/demo route is intentionally minimal to help judges validate functionality quickly without building locally.

📬 Contact

If you want help extending the verifier, adding more proof circuits, or integrating a different L2, open an issue or contact the maintainer.
