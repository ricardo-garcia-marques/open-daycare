"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Kid } from "@/lib/mock-kids";
import {
  useKidsStore,
  validateBirthDate,
  type KidFormData,
} from "@/lib/kids-store";

const ROOM_OPTIONS = ["Soles", "Estrellas", "Luna"];

const FIELD_LABEL_CLASS =
  "text-[12px] font-extrabold tracking-[0.7px] text-[#94887B] mb-2";
const FIELD_INPUT_CLASS =
  "w-full py-[13px] px-4 rounded-[14px] border-[1.5px] bg-white text-[15px] text-[#3F362E] outline-none";

export type AddKidModalMode =
  | { kind: "create" }
  | { kind: "edit"; kid: Kid };

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function parseBirthDateParts(maskedDate: string): {
  day: number | null;
  month: number | null;
  year: number | null;
} {
  const match = /^(\d{1,2})(?:\/(\d{1,2}))?(?:\/(\d{1,4}))?$/.exec(maskedDate);
  if (!match) {
    return { day: null, month: null, year: null };
  }
  return {
    day: Number(match[1]) || null,
    month: match[2] ? Number(match[2]) || null : null,
    year: match[3] ? Number(match[3]) || null : null,
  };
}

export function maskBirthDateInput(
  previousValue: string,
  rawValue: string
): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  if (digits === previousValue.replace(/\D/g, "")) {
    return previousValue;
  }
  let masked = digits.slice(0, 2);
  if (digits.length > 2) {
    masked += "/" + digits.slice(2, 4);
  }
  if (digits.length > 4) {
    masked += "/" + digits.slice(4, 8);
  }
  if (masked === previousValue) {
    return previousValue;
  }
  const parts = parseBirthDateParts(masked);
  if (parts.day !== null && parts.day > 31) {
    masked = "31" + masked.slice(2);
  }
  if (parts.month !== null && parts.month > 12) {
    masked = masked.slice(0, 3) + "12" + masked.slice(5);
  }
  return masked;
}

function buildInitialFormData(kid?: Kid): KidFormData {
  if (kid) {
    const monthLetterMatch = /^(\d+) ([a-zñ]+) (\d{4})$/.exec(kid.birthDate);
    const monthIndex = monthLetterMatch
      ? [
          "ene", "feb", "mar", "abr", "may", "jun",
          "jul", "ago", "sep", "oct", "nov", "dic",
        ].indexOf(monthLetterMatch[2])
      : -1;
    const masked =
      monthIndex >= 0
        ? `${monthLetterMatch![1].padStart(2, "0")}/${String(
            monthIndex + 1
          ).padStart(2, "0")}/${monthLetterMatch![3]}`
        : "";
    return {
      fullName: kid.name,
      birthDate: masked,
      room: kid.room,
      allergiesRaw: kid.allergies.join(", "),
      medicalNotes: kid.allergyNote,
    };
  }
  return { fullName: "", birthDate: "", room: "Soles", allergiesRaw: "", medicalNotes: "" };
}

export function AddKidModal({
  mode,
  onClose,
}: {
  mode: AddKidModalMode;
  onClose: () => void;
}) {
  const { saveKid } = useKidsStore();
  const [formData, setFormData] = useState<KidFormData>(() =>
    buildInitialFormData(mode.kind === "edit" ? mode.kid : undefined)
  );

  const birthDateError = useMemo(() => validateBirthDate(formData.birthDate), [
    formData.birthDate,
  ]);
  const canSave = formData.fullName.trim().length > 0 && !birthDateError;

  const handleBirthDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((current) => ({
        ...current,
        birthDate: maskBirthDateInput(current.birthDate, event.target.value),
      }));
    },
    []
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSave() {
    if (!canSave) {
      return;
    }
    saveKid(formData, mode.kind === "edit" ? mode.kid.id : undefined);
    onClose();
  }

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
        className="w-full max-w-[520px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={mode.kind === "edit" ? "Editar niño" : "Agregar niño"}
      >
        <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
          <button
            type="button"
            onClick={onClose}
            className="text-[#94887B] font-bold text-[15px] cursor-pointer"
          >
            Cancelar
          </button>
          <span className="font-display font-semibold text-[18px] text-[#3F362E]">
            {mode.kind === "edit" ? "Editar niño" : "Agregar niño"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`font-extrabold text-[15px] ${
              canSave
                ? "text-[#D9583C] cursor-pointer"
                : "text-[#D9583C]/40 cursor-not-allowed"
            }`}
          >
            Guardar
          </button>
        </div>

        <div className="p-[26px]">
          <div className={FIELD_LABEL_CLASS}>NOMBRE COMPLETO</div>
          <input
            value={formData.fullName}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            placeholder="Ej. Martina López"
            className={`${FIELD_INPUT_CLASS} border-[#EADFD0] mb-[18px] placeholder:text-[#B6A99B]`}
          />

          <div className="flex gap-[14px] mb-[18px]">
            <div className="flex-1 min-w-0">
              <div className={FIELD_LABEL_CLASS}>FECHA DE NACIMIENTO</div>
              <input
                value={formData.birthDate}
                onChange={handleBirthDateChange}
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                className={`${FIELD_INPUT_CLASS} ${
                  birthDateError ? "border-[#D9583C]" : "border-[#EADFD0]"
                } placeholder:text-[#B6A99B]`}
              />
              {birthDateError ? (
                <p className="mt-[6px] mb-0 text-[12.5px] font-bold text-[#C5413A]">
                  {birthDateError}
                </p>
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className={FIELD_LABEL_CLASS}>SALA</div>
              <div className="relative">
                <select
                  value={formData.room}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      room: event.target.value,
                    }))
                  }
                  className={`${FIELD_INPUT_CLASS} border-[#EADFD0] font-bold appearance-none pr-10 cursor-pointer`}
                >
                  {ROOM_OPTIONS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
          </div>

          <div className={FIELD_LABEL_CLASS}>ALERGIAS (ETIQUETAS)</div>
          <input
            value={formData.allergiesRaw}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                allergiesRaw: event.target.value,
              }))
            }
            placeholder="Ej. Maní, Lactosa"
            className={`${FIELD_INPUT_CLASS} border-[#EADFD0] mb-[18px] placeholder:text-[#B6A99B]`}
          />

          <div className={FIELD_LABEL_CLASS}>NOTAS MÉDICAS</div>
          <textarea
            value={formData.medicalNotes}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                medicalNotes: event.target.value,
              }))
            }
            placeholder="Indicaciones, medicación, contactos…"
            className={`${FIELD_INPUT_CLASS} border-[#EADFD0] min-h-[90px] resize-y leading-normal placeholder:text-[#B6A99B]`}
          />
        </div>
      </div>
    </div>
  );
}
