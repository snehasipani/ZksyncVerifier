// scripts/deploy.ts
import hre from "hardhat";

console.log("Sneha Sipani");

async function main() {
  const { ethers } = hre; // <-- destructure from default import (works for ESM + CommonJS)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", await deployer.getAddress());

  // ProofOfCreativity
  const ProofFactory = await ethers.getContractFactory("ProofOfCreativity");
  const proof = await ProofFactory.connect(deployer).deploy();

  // Prefer ethers v6 API; fallback to deployTransaction wait (cast to any for TS)
  if (typeof (proof as any).waitForDeployment === "function") {
    await (proof as any).waitForDeployment();
  } else if (proof.deployTransaction) {
    await (proof.deployTransaction as any).wait();
  }

  const proofAddress = (proof as any).target ?? (proof as any).address;
  console.log("ProofOfCreativity deployed to:", proofAddress);

  // ProofNFT
  const ProofNFTFactory = await ethers.getContractFactory("ProofNFT");
  const nft = await ProofNFTFactory.connect(deployer).deploy("ProofNFT", "PNFT");

  if (typeof (nft as any).waitForDeployment === "function") {
    await (nft as any).waitForDeployment();
  } else if (nft.deployTransaction) {
    await (nft.deployTransaction as any).wait();
  }

  const nftAddress = (nft as any).target ?? (nft as any).address;
  console.log("ProofNFT deployed to:", nftAddress);

  console.log(JSON.stringify({ ProofOfCreativity: proofAddress, ProofNFT: nftAddress }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
