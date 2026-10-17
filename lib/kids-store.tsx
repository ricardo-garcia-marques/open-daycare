"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { KIDS, type Kid } from "@/lib/mock-kids";

const STORAGE_KEY = "opendaycare:kids:v1";

const AVATAR_PALETTE: Array<Pick<Kid, "avatarBgColor" | "avatarTextColor">> = [
  { avatarBgColor: "#F4B8CC", avatarTextColor: "#C44A7A" },
  { avatarBgColor: "#F4DC8E", avatarTextColor: "#9A7B1E" },
  { avatarBgColor: "#C9B6E8", avatarTextColor: "#6B4FA0" },
  { avatarBgColor: "#A9C7E8", avatarTextColor: "#2E5FA6" },
  { avatarBgColor: "#B9DEC4", avatarTextColor: "#3E8B62" },
];

const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function readStoredKids(): Kid[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Kid[]) : null;
  } catch {
    return null;
  }
}

export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatBirthDate(maskedDate: string): string {
  const [day, month, year] = maskedDate.split("/").map(Number);
  return `${day} ${MONTH_LABELS[month - 1]} ${year}`;
}

export function currentEnrolledLabel(): string {
  const now = new Date();
  return `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
}

export function calculateAgeInYears(birthDate: string): number {
  const [day, month, year] = birthDate.split("/").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) {
    age -= 1;
  }
  return age;
}

export function validateBirthDate(maskedDate: string): string | null {
  if (maskedDate.length < 10) {
    return "Completá la fecha con el formato dd/mm/aaaa.";
  }
  const [day, month, year] = maskedDate.split("/").map(Number);
  if (month < 1 || month > 12) {
    return "El mes debe estar entre 01 y 12.";
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return "Esa fecha no existe en el calendario.";
  }
  const parsed = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed > today) {
    return "La fecha de nacimiento no puede ser futura.";
  }
  return null;
}

export type KidFormData = {
  fullName: string;
  birthDate: string;
  room: string;
  allergiesRaw: string;
  medicalNotes: string;
};

function buildKidFromForm(formData: KidFormData): Kid {
  const initial = formData.fullName.trim().charAt(0).toUpperCase();
  const paletteEntry =
    AVATAR_PALETTE[Math.abs(hashCode(formData.fullName)) % AVATAR_PALETTE.length];
  return {
    id: slugifyName(formData.fullName),
    name: formData.fullName.trim(),
    ageInYears: calculateAgeInYears(formData.birthDate),
    allergies: formData.allergiesRaw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    initial,
    ...paletteEntry,
    birthDate: formatBirthDate(formData.birthDate),
    enrolledAt: currentEnrolledLabel(),
    room: formData.room,
    allergyNote: formData.medicalNotes.trim(),
    linkedParents: [],
  };
}

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

type KidsStoreValue = {
  kids: Kid[];
  hydrated: boolean;
  saveKid: (formData: KidFormData, kidId?: string) => void;
  getKidById: (id: string) => Kid | undefined;
};

let storeSnapshot: { kids: Kid[]; hydrated: boolean } = {
  kids: KIDS,
  hydrated: false,
};

const storeListeners = new Set<() => void>();

function emitStoreChange(next: { kids: Kid[]; hydrated: boolean }) {
  storeSnapshot = next;
  for (const listener of storeListeners) {
    listener();
  }
}

function subscribeToStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function getStoreSnapshot(): { kids: Kid[]; hydrated: boolean } {
  return storeSnapshot;
}

function getServerStoreSnapshot(): { kids: Kid[]; hydrated: boolean } {
  return { kids: KIDS, hydrated: false };
}

function hydrateStore() {
  if (!storeSnapshot.hydrated) {
    emitStoreChange({ kids: readStoredKids() ?? KIDS, hydrated: true });
  }
}

const KidsStoreContext = createContext<KidsStoreValue | null>(null);

export function KidsStoreProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getServerStoreSnapshot
  );

  useEffect(() => {
    hydrateStore();
  }, []);

  const saveKid = useCallback((formData: KidFormData, kidId?: string) => {
    const kid = buildKidFromForm(formData);
    let nextKids: Kid[];
    if (kidId) {
      nextKids = storeSnapshot.kids.map((candidate) =>
        candidate.id === kidId ? kid : candidate
      );
    } else {
      nextKids = [kid, ...storeSnapshot.kids.filter((c) => c.id !== kid.id)];
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextKids));
    } catch {
      // localStorage unavailable: the kids list still updates in memory.
    }
    emitStoreChange({ kids: nextKids, hydrated: true });
  }, []);

  const getKidById = useCallback(
    (id: string) => store.kids.find((candidate) => candidate.id === id),
    [store.kids]
  );

  const value = useMemo(
    () => ({ kids: store.kids, hydrated: store.hydrated, saveKid, getKidById }),
    [store, saveKid, getKidById]
  );

  return (
    <KidsStoreContext.Provider value={value}>
      {children}
    </KidsStoreContext.Provider>
  );
}

export function useKidsStore(): KidsStoreValue {
  const context = useContext(KidsStoreContext);
  if (!context) {
    throw new Error("useKidsStore must be used within KidsStoreProvider");
  }
  return context;
}
