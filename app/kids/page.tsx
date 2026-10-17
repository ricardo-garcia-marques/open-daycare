"use client";

import { useState } from "react";
import { Sidebar } from "../(components)/sidebar";
import { KidsSearch } from "../(components)/kids-search";
import { AddKidModal, type AddKidModalMode } from "../(components)/add-kid-modal";
import { useKidsStore } from "@/lib/kids-store";

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

export default function KidsPage() {
  const { kids } = useKidsStore();
  const [modalMode, setModalMode] = useState<AddKidModalMode | null>(null);

  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />

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
            <button
              type="button"
              onClick={() => setModalMode({ kind: "create" })}
              className="flex items-center gap-2 py-[11px] px-[18px] rounded-[14px] bg-gradient-to-b from-compose-gradient-from to-compose-gradient-to text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] cursor-pointer"
            >
              <PlusIcon />
              Agregar niño
            </button>
          </div>

          <KidsSearch kids={kids} />
        </div>
      </main>

      {modalMode ? <AddKidModal mode={modalMode} onClose={() => setModalMode(null)} /> : null}
    </div>
  );
}
