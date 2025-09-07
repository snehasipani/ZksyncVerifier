import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "../app/components/Header";
import Footer from "../app/components/Footer";
import Web3Provider from "../app/components/Web3Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "zkProof of Creativity",
  description: "Prove & timestamp creative work on zkSync",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-neutral-900 text-white antialiased flex flex-col`}>
        <Web3Provider>
          <Header />
          <main className="flex-1 max-w-5xl mx-auto w-full p-4">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
