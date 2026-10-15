import Link from "next/link";
import { Sidebar } from "../(components)/sidebar";
import { KIDS, type Kid } from "@/lib/mock-kids";

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

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
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

const PARENTS_LABELS = {
  none: "sin padres vinculados",
} as const;

function parentsLabel(kid: Kid): string {
  if (kid.linkedParents === 0) {
    return PARENTS_LABELS.none;
  }
  return `${kid.linkedParents} ${kid.linkedParents === 1 ? "padre vinculado" : "padres vinculados"}`;
}

export function KidCard({ kid }: { kid: Kid }) {
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

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-page-bg">
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[880px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="flex items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
                GESTIÓN
              </div>
              <h1 className="font-display font-semibold text-[30px] m-0 text-heading">
                Niños
              </h1>
            </div>
            <Link
              href="/kids/agregar"
              className="flex items-center gap-2 py-[11px] px-[18px] rounded-[14px] bg-gradient-to-b from-compose-gradient-from to-compose-gradient-to text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
            >
              <PlusIcon />
              Agregar niño
            </Link>
          </div>

          <div className="flex items-center gap-[11px] bg-surface border border-border rounded-[14px] py-3 px-4 mb-[22px]">
            <SearchIcon />
            <input
              type="text"
              placeholder="Buscar niño…"
              className="flex-1 border-none bg-transparent outline-none text-[15px] text-heading placeholder:text-[#B6A99B]"
            />
          </div>

          <div className="flex items-center gap-3 mb-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-heading">
              SALA SOLES
            </span>
            <span className="text-[13px] text-muted-light">
              {KIDS.length} niños
            </span>
            <span className="flex-1 h-px bg-divider" />
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            {KIDS.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
