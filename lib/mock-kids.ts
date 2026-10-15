export type ParentLinkStatus = "active" | "pending";

export interface LinkedParent {
  name: string;
  role: string;
  status: ParentLinkStatus;
  initial: string;
  avatarBgColor: string;
}

export interface Kid {
  id: string;
  name: string;
  ageInYears: number;
  allergies: string[];
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  birthDate: string;
  enrolledAt: string;
  room: string;
  allergyNote: string;
  linkedParents: LinkedParent[];
}

export const KIDS: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    ageInYears: 3,
    allergies: ["maní"],
    initial: "M",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    birthDate: "12 mar 2022",
    enrolledAt: "feb 2025",
    room: "Soles",
    allergyNote:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    linkedParents: [
      {
        name: "Lucía Fernández",
        role: "Mamá",
        status: "active",
        initial: "L",
        avatarBgColor: "#C9B6E8",
      },
      {
        name: "Diego Fernández",
        role: "Papá",
        status: "pending",
        initial: "D",
        avatarBgColor: "#A9C7E8",
      },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    ageInYears: 2,
    allergies: [],
    initial: "S",
    avatarBgColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    birthDate: "3 sep 2023",
    enrolledAt: "ago 2024",
    room: "Soles",
    allergyNote: "",
    linkedParents: [
      {
        name: "Valeria Méndez",
        role: "Mamá",
        status: "active",
        initial: "V",
        avatarBgColor: "#F4DC8E",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    ageInYears: 3,
    allergies: [],
    initial: "B",
    avatarBgColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    birthDate: "25 may 2022",
    enrolledAt: "mar 2024",
    room: "Soles",
    allergyNote: "",
    linkedParents: [
      {
        name: "Pablo Ruiz",
        role: "Papá",
        status: "active",
        initial: "P",
        avatarBgColor: "#A9C7E8",
      },
      {
        name: "Carla Ruiz",
        role: "Mamá",
        status: "active",
        initial: "C",
        avatarBgColor: "#F4B8CC",
      },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    ageInYears: 2,
    allergies: [],
    initial: "V",
    avatarBgColor: "#F4DC8E",
    avatarTextColor: "#9A7B1E",
    birthDate: "8 dic 2023",
    enrolledAt: "ene 2025",
    room: "Soles",
    allergyNote: "",
    linkedParents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    ageInYears: 3,
    allergies: ["lactosa"],
    initial: "T",
    avatarBgColor: "#C9B6E8",
    avatarTextColor: "#7B5FC0",
    birthDate: "19 jul 2022",
    enrolledAt: "jun 2024",
    room: "Soles",
    allergyNote:
      "Intolerancia a la lactosa. Tomar leche vegetal del armario azul.",
    linkedParents: [
      {
        name: "Martín Díaz",
        role: "Papá",
        status: "active",
        initial: "M",
        avatarBgColor: "#B9DEC4",
      },
    ],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    ageInYears: 2,
    allergies: [],
    initial: "E",
    avatarBgColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    birthDate: "30 abr 2023",
    enrolledAt: "sep 2024",
    room: "Soles",
    allergyNote: "",
    linkedParents: [
      {
        name: "Jorgelina Castro",
        role: "Mamá",
        status: "active",
        initial: "J",
        avatarBgColor: "#C9B6E8",
      },
      {
        name: "Nicolás Castro",
        role: "Papá",
        status: "pending",
        initial: "N",
        avatarBgColor: "#A9C7E8",
      },
    ],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    ageInYears: 3,
    allergies: [],
    initial: "L",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    birthDate: "2 feb 2022",
    enrolledAt: "ago 2023",
    room: "Soles",
    allergyNote: "",
    linkedParents: [
      {
        name: "Sabrina Romero",
        role: "Mamá",
        status: "active",
        initial: "S",
        avatarBgColor: "#F4DC8E",
      },
    ],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    ageInYears: 2,
    allergies: [],
    initial: "O",
    avatarBgColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    birthDate: "14 nov 2023",
    enrolledAt: "oct 2024",
    room: "Soles",
    allergyNote: "",
    linkedParents: [
      {
        name: "Hernán Vega",
        role: "Papá",
        status: "active",
        initial: "H",
        avatarBgColor: "#A9D9E8",
      },
      {
        name: "Pilar Vega",
        role: "Mamá",
        status: "pending",
        initial: "P",
        avatarBgColor: "#F4B8CC",
      },
    ],
  },
];
