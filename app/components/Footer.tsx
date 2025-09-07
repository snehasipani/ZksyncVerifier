"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-800 bg-neutral-900 px-4 py-6 text-center text-sm text-neutral-400 mt-10">
      <p>
        Built with ❤️ on{" "}
        <a
          href="https://zksync.io/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-white hover:underline"
        >
          zkSync
        </a>{" "}
        • Files on{" "}
        <a
          href="https://ipfs.tech/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-white hover:underline"
        >
          IPFS
        </a>{" "}
        • Proofs stored on-chain
      </p>
      <p className="mt-2">
        © {new Date().getFullYear()} zkProof of Creativity.{" "}
        <a
          href="https://github.com/snehasipani"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-400 hover:underline"
        >
          GitHub
        </a>{" "}
        • MIT License
      </p>
    </footer>
  );
}
