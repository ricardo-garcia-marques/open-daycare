export type PostType = "achievement" | "activity" | "announcement";

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
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
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
