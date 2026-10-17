export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type NavIcon = "home" | "kids" | "bell" | "user";

export interface FeedPost {
  id: string;
  authorInitial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  authorName: string;
  time: string;
  type: PostType;
  addressedTo: string;
  text: string;
  likes: number;
  comments: number;
  photoPlaceholder?: { alt: string };
}

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

export const FEED_POSTS: FeedPost[] = [
  {
    id: "post-mateo-achievement",
    authorInitial: "M",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    authorName: "Mateo",
    time: "14:20",
    type: "achievement",
    addressedTo: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-mateo-activity",
    authorInitial: "M",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    authorName: "Mateo",
    time: "09:40",
    type: "activity",
    addressedTo: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    likes: 5,
    comments: 2,
    photoPlaceholder: { alt: "Foto · pintando con témperas" },
  },
  {
    id: "post-general-announcement",
    authorInitial: "",
    avatarBgColor: "#CCD8F4",
    avatarTextColor: "#4E72C8",
    authorName: "Anuncio general",
    time: "07:50",
    type: "announcement",
    addressedTo: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
