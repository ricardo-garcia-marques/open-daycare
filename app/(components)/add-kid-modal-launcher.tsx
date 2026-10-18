"use client";

import { useState } from "react";
import { AddKidModal } from "./add-kid-modal";

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

export function AddKidModalLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 py-[11px] px-[18px] rounded-[14px] bg-gradient-to-b from-compose-gradient-from to-compose-gradient-to text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] cursor-pointer"
      >
        <PlusIcon />
        Agregar niño
      </button>
      {open ? <AddKidModal mode={{ kind: "create" }} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
