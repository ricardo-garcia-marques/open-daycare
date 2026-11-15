export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type NavIcon = "home" | "kids" | "bell" | "user";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  meal: "COMIDA",
  nap: "SIESTA",
  activity: "ACTIVIDAD",
  achievement: "LOGRO",
  mood: "ÁNIMO",
  photo: "FOTO",
  announcement: "ANUNCIO",
};

export const POST_TYPE_BADGE_COLORS: Record<PostType, { bg: string; text: string }> = {
  meal: { bg: "#9A7B1E", text: "#FFFFFF" },
  nap: { bg: "#E7DCF6", text: "#7B5FC0" },
  activity: { bg: "#2E89A6", text: "#FFFFFF" },
  achievement: { bg: "#CFEBD8", text: "#3E9B6C" },
  mood: { bg: "#F9D2DE", text: "#C56486" },
  photo: { bg: "#FBD8CC", text: "#D9684A" },
  announcement: { bg: "#CCD8F4", text: "#4E72C8" },
};
