"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Kid } from "@/lib/mock-kids";

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function parentsLabel(kid: Kid): string {
  if (kid.linkedParents === 0) {
    return "sin padres vinculados";
  }
  return `${kid.linkedParents} ${kid.linkedParents === 1 ? "padre vinculado" : "padres vinculados"}`;
}

function KidCard({ kid }: { kid: Kid }) {
  const showAllergyBadge = kid.allergies.length > 0;
  const showLinkBadge = kid.linkedParents === 0;

  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex items-center gap-[14px] min-w-0 bg-surface border border-border rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[border-color,transform] duration-150 hover:border-[#F2A78E] hover:-translate-y-0.5"
    >
      <div
        className="w-12 h-12 rounded-full font-display font-semibold text-[19px] flex items-center justify-center flex-none"
        style={{ background: kid.avatarBgColor, color: kid.avatarTextColor }}
      >
        {kid.initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[16px] text-heading">
          {kid.name}
        </div>
        <div className="text-[13px] text-muted-light">
          {kid.ageInYears} años · {parentsLabel(kid)}
        </div>
      </div>
      {showAllergyBadge ? (
        <span className="flex-none text-[11px] font-extrabold py-[5px] px-[9px] rounded-full bg-chip-allergy-bg text-chip-allergy uppercase">
          {kid.allergies[0]}
        </span>
      ) : showLinkBadge ? (
        <span className="flex-none text-[11px] font-extrabold py-[5px] px-[9px] rounded-full bg-chip-link-bg text-chip-link">
          VINCULAR
        </span>
      ) : (
        <ChevronIcon />
      )}
    </Link>
  );
}

export function KidsSearch({ kids }: { kids: Kid[] }) {
  const [query, setQuery] = useState("");

  const filteredKids = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return kids;
    }
    return kids.filter((kid) =>
      kid.name.toLowerCase().includes(normalizedQuery)
    );
  }, [kids, query]);

  return (
    <>
      <div className="flex items-center gap-[11px] bg-surface border border-border rounded-[14px] py-3 px-4 mb-[22px]">
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          className="flex-1 border-none bg-transparent outline-none text-[15px] text-heading placeholder:text-[#B6A99B]"
        />
      </div>

      <div className="flex items-center gap-3 mb-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-heading">
          SALA SOLES
        </span>
        <span className="text-[13px] text-muted-light">
          {filteredKids.length} niños
        </span>
        <span className="flex-1 h-px bg-divider" />
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        {filteredKids.map((kid) => (
          <KidCard key={kid.id} kid={kid} />
        ))}
      </div>
    </>
  );
}
