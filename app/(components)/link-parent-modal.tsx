"use client";

import { useEffect, useMemo, useState } from "react";
import type { Kid } from "@/lib/mock-kids";
import { useKidsStore } from "@/lib/kids-store";

const INVITATION_CODE = "7K4P9";

const RELATIONSHIP_OPTIONS = ["Mamá", "Papá", "Tutor/a"] as const;

const FIELD_LABEL_CLASS =
  "text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2";
const FIELD_INPUT_CLASS =
  "w-full py-[13px] px-4 rounded-[14px] border-[1.5px] bg-white text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";

function CloseIcon() {
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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E72C8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none mt-[1px]"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeParentName(name: string): string {
  return name.trim().toLowerCase();
}

export function LinkParentModal({
  kid,
  onClose,
  onSubmit,
}: {
  kid: Kid;
  onClose: () => void;
  onSubmit: (parent: { name: string; role: string }) => void;
}) {
  const { kids } = useKidsStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<
    (typeof RELATIONSHIP_OPTIONS)[number] | null
  >(null);

  const trimmedName = name.trim();
  const emailError = useMemo(() => {
    if (!email.trim()) {
      return null;
    }
    return EMAIL_PATTERN.test(email.trim())
      ? null
      : "Ingresá un email válido (ej. nombre@correo.com).";
  }, [email]);
  const duplicateError = useMemo(() => {
    if (!trimmedName) {
      return null;
    }
    const currentKid = kids.find((candidate) => candidate.id === kid.id);
    const isDuplicate = (currentKid?.linkedParents ?? []).some(
      (parent) =>
        normalizeParentName(parent.name) === normalizeParentName(trimmedName)
    );
    return isDuplicate
      ? "Esa persona ya está vinculada a este niño."
      : null;
  }, [kids, kid.id, trimmedName]);

  const canSubmit =
    trimmedName.length > 0 &&
    !emailError &&
    relationship !== null &&
    !duplicateError;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-6 bg-[rgba(63,54,46,0.45)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[480px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Vincular padre"
      >
        <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
          <div>
            <div className="font-display font-semibold text-[18px] text-heading">
              Vincular padre
            </div>
            <div className="text-[13px] text-muted-light">a {kid.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-[34px] h-[34px] rounded-[10px] bg-[#F0E6D8] text-[#94887B] flex items-center justify-center cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="py-[22px] px-[26px]">
          <div className="flex gap-[11px] bg-[#E3ECFB] rounded-[14px] py-[13px] px-4 mb-5">
            <InfoIcon />
            <span className="text-[13.5px] text-[#3F5694] leading-[1.45]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {kid.name.split(" ")[0]}.
            </span>
          </div>

          <div className={FIELD_LABEL_CLASS}>NOMBRE DEL PADRE/MADRE</div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Diego Fernández"
            className={`${FIELD_INPUT_CLASS} ${
              duplicateError ? "border-[#D9583C]" : "border-[#EADFD0]"
            } mb-[18px]`}
          />
          {duplicateError ? (
            <p className="-mt-3 mb-[10px] text-[12.5px] font-bold text-[#C5413A]">
              {duplicateError}
            </p>
          ) : null}

          <div className={FIELD_LABEL_CLASS}>EMAIL</div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            className={`${FIELD_INPUT_CLASS} ${
              emailError ? "border-[#D9583C]" : "border-[#EADFD0]"
            } mb-[18px]`}
          />
          {emailError ? (
            <p className="-mt-3 mb-[10px] text-[12.5px] font-bold text-[#C5413A]">
              {emailError}
            </p>
          ) : null}

          <div className={`${FIELD_LABEL_CLASS} mb-[10px]`}>PARENTESCO</div>
          <div className="flex gap-[9px] mb-5">
            {RELATIONSHIP_OPTIONS.map((option) => {
              const isSelected = relationship === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRelationship(option)}
                  className={`flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px] cursor-pointer ${
                    isSelected
                      ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                      : "border-[#ECE0D0] bg-surface text-nav-inactive"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="bg-[#FBF1D6] border-[1.5px] border-dashed border-[#E6D08A] rounded-[16px] py-[18px] text-center mb-5">
            <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#A88526] mb-2">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8A7234]">
              {INVITATION_CODE}
            </div>
            <div className="text-[13px] text-[#A88526] mt-[6px]">
              Vence en 7 días
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || relationship === null) {
                return;
              }
              onSubmit({ name: trimmedName, role: relationship });
            }}
            className={`flex items-center justify-center gap-[9px] w-full py-[14px] rounded-[14px] text-white font-extrabold text-[15.5px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] ${
              canSubmit
                ? "shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] cursor-pointer"
                : "opacity-40 cursor-not-allowed shadow-none"
            }`}
          >
            <SendIcon />
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  );
}
