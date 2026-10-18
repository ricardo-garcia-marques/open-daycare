const AVATAR_PALETTE = [
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

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function kidsAvatarColors(fullName: string) {
  return AVATAR_PALETTE[Math.abs(hashCode(fullName)) % AVATAR_PALETTE.length];
}

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function calculateAgeInYears(birthDate: string): number {
  const birth = parseIsoDate(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) {
    age -= 1;
  }
  return age;
}

export function formatIsoDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatIsoMonth(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export type KidFormData = {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergiesRaw: string;
  medicalNotes: string;
};

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

export function maskedDateToIso(maskedDate: string): string {
  const [day, month, year] = maskedDate.split("/").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isoDateToMasked(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function parseAllergyTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
