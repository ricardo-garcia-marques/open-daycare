"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { AddKidModal, type AddKidModalMode } from "./add-kid-modal";
import { useKidsStore } from "@/lib/kids-store";
import type { LinkedParent } from "@/lib/mock-kids";

const PARENT_STATUS_LABELS: Record<LinkedParent["status"], string> = {
  active: "ACTIVA",
  pending: "PENDIENTE",
};

const PARENT_STATUS_SUBTITLES: Record<LinkedParent["status"], string> = {
  active: "activa",
  pending: "invitación enviada",
};

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SunIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-[15px] px-[18px] border-b border-border-soft last:border-b-0">
      <span className="text-muted text-[14.5px]">{label}</span>
      <span className="font-extrabold text-heading text-[14.5px]">{value}</span>
    </div>
  );
}

function ParentRow({ parent }: { parent: LinkedParent }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full text-white font-display font-semibold text-[16px] flex items-center justify-center flex-none"
        style={{ background: parent.avatarBgColor }}
      >
        {parent.initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-[14.5px] text-heading">
          {parent.name}
        </div>
        <div className="text-[12.5px] text-muted-light">
          {parent.role} · {PARENT_STATUS_SUBTITLES[parent.status]}
        </div>
      </div>
      <span
        className={`flex-none text-[10.5px] font-extrabold py-1 px-[9px] rounded-full ${
          parent.status === "active"
            ? "bg-badge-achievement-bg text-badge-achievement"
            : "bg-[#F7E7A6] text-[#9A7B1E]"
        }`}
      >
        {PARENT_STATUS_LABELS[parent.status]}
      </span>
    </div>
  );
}

export function KidProfile({ kidId }: { kidId: string }) {
  const { hydrated, getKidById } = useKidsStore();
  const [modalMode, setModalMode] = useState<AddKidModalMode | null>(null);

  const kid = getKidById(kidId);

  if (hydrated && !kid) {
    notFound();
  }

  if (!kid) {
    return (
      <div className="flex min-h-screen bg-page-bg">
        <Sidebar />
        <main className="flex-1 min-w-0 h-screen overflow-y-auto" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[820px] w-full mx-auto px-10 pt-[34px] pb-20">
          <Link
            href="/kids"
            className="flex items-center gap-[7px] text-muted font-bold text-[14px] mb-5"
          >
            <ChevronLeftIcon />
            Volver a Niños
          </Link>

          <div className="flex gap-[26px] flex-wrap items-start">
            <div className="flex-1 min-w-[300px] flex flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <div
                  className="w-[84px] h-[84px] rounded-full font-display font-semibold text-[34px] flex items-center justify-center flex-none"
                  style={{ background: kid.avatarBgColor, color: kid.avatarTextColor }}
                >
                  {kid.initial}
                </div>
                <div className="flex-1">
                  <h1 className="font-display font-semibold text-[28px] m-0 text-heading">
                    {kid.name}
                  </h1>
                  <p className="mt-[3px] mb-0 text-muted text-[15px]">
                    {kid.ageInYears} años · Sala {kid.room}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalMode({ kind: "edit", kid })}
                  className="border-[1.5px] border-border bg-surface text-nav-inactive font-bold text-[14px] py-[9px] px-4 rounded-xl cursor-pointer"
                >
                  Editar
                </button>
              </div>

              {kid.allergyNote ? (
                <div className="flex gap-[14px] bg-[#FBDAD6] rounded-2xl py-4 px-[18px]">
                  <div className="w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center flex-none">
                    <WarningIcon />
                  </div>
                  <div>
                    <div className="font-extrabold text-[#C5413A] text-[15px] mb-[2px]">
                      Alergias y notas
                    </div>
                    <div className="text-[#B25249] text-[14.5px] leading-normal">
                      {kid.allergyNote}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <InfoRow label="Fecha de nacimiento" value={kid.birthDate} />
                <InfoRow label="Sala" value={kid.room} />
                <InfoRow label="Ingreso" value={kid.enrolledAt} />
              </div>
            </div>

            <div className="w-[300px] flex-none flex flex-col gap-[14px]">
              <Link
                href="/day-summary"
                className="flex items-center justify-center gap-[9px] w-full py-[13px] rounded-[14px] bg-heading text-white font-extrabold text-[15px]"
              >
                <SunIcon size={18} strokeWidth={2} />
                Resumen del día
              </Link>

              <div className="bg-surface border border-border rounded-2xl p-4 px-[18px]">
                <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-label mb-[14px]">
                  PADRES VINCULADOS
                </div>
                <div className="flex flex-col gap-[14px]">
                  {kid.linkedParents.map((parent) => (
                    <ParentRow key={parent.name} parent={parent} />
                  ))}
                  <Link
                    href={`/kids/${kid.id}/vincular-padre`}
                    className="flex items-center gap-3 pt-2"
                  >
                    <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290] flex-none">
                      <PlusIcon />
                    </span>
                    <span className="font-extrabold text-[14.5px] text-primary-strong">
                      Vincular otro padre
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {modalMode ? <AddKidModal mode={modalMode} onClose={() => setModalMode(null)} /> : null}
    </div>
  );
}
