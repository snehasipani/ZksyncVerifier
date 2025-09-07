// components/Timeline.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import ProofCard, { Proof } from "./ProofCard";

type TimelineProps = {
  proofs: Proof[];
  onSelect?: (p: Proof) => void;
  highlighted?: string | null;
};

export default function Timeline({ proofs, onSelect, highlighted = null }: TimelineProps) {
  const [query, setQuery] = useState("");

  function formatGroup(ts: number): string {
    const d = new Date(ts * 1000);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 1) return "Today";
    if (diff < 7) return "This Week";
    return "Older";
  }

  const grouped = useMemo(() => {
    if (!proofs) return {};
    const sorted = [...proofs].sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
    const q = query.toLowerCase();
    const filtered = sorted.filter(
      (p) =>
        (p.cid ?? "").toLowerCase().includes(q) ||
        (p.owner ?? "").toLowerCase().includes(q) ||
        ((p.title ?? "").toLowerCase().includes(q) ?? false)
    );
    return filtered.reduce<Record<string, Proof[]>>((acc, p) => {
      const group = formatGroup(p.ts ?? 0);
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    }, {});
  }, [proofs, query]);

  const groups = Object.keys(grouped);

  if (!proofs || proofs.length === 0) {
    return <div className="text-sm text-neutral-400">No proofs yet.</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by CID, owner, or title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 rounded bg-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-700" />

        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-neutral-400 mb-3 ml-10">{group}</h3>
              <div className="flex flex-col gap-6">
                {grouped[group].map((p) => {
                  const id = encodeURIComponent(p.proof ?? p.cid);
                  const isHighlighted = !!(highlighted && p.proof === highlighted);

                  const wrapperClass =
                    "relative pl-10 " + (isHighlighted ? "ring-2 ring-indigo-600 rounded" : "");

                  const handleClick = (e?: React.MouseEvent) => {
                    // call onSelect (if provided) in addition to navigation
                    onSelect?.(p);
                  };

                  return (
                    <div key={p.proof ?? p.cid} className={wrapperClass}>
                      <span className="absolute left-4 top-4 w-3 h-3 rounded-full bg-indigo-500 shadow-md" />

                      <Link
                        href={`/proofs/${id}`}
                        prefetch={false}
                        className="block"
                        aria-label={`Open proof ${p.title ?? p.proof}`}
                        onClick={handleClick}
                      >
                        <ProofCard proof={p} highlighted={isHighlighted} />
                      </Link>

                      {onSelect && (
                        <div
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onSelect(p);
                          }}
                          aria-hidden
                          className="sr-only"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
