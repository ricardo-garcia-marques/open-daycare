export interface Kid {
  id: string;
  name: string;
  ageInYears: number;
  linkedParents: number;
  allergies: string[];
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
}

export const KIDS: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    ageInYears: 3,
    linkedParents: 2,
    allergies: ["maní"],
    initial: "M",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    ageInYears: 2,
    linkedParents: 1,
    allergies: [],
    initial: "S",
    avatarBgColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    ageInYears: 3,
    linkedParents: 2,
    allergies: [],
    initial: "B",
    avatarBgColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    ageInYears: 2,
    linkedParents: 0,
    allergies: [],
    initial: "V",
    avatarBgColor: "#F4DC8E",
    avatarTextColor: "#9A7B1E",
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    ageInYears: 3,
    linkedParents: 1,
    allergies: ["lactosa"],
    initial: "T",
    avatarBgColor: "#C9B6E8",
    avatarTextColor: "#7B5FC0",
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    ageInYears: 2,
    linkedParents: 1,
    allergies: [],
    initial: "E",
    avatarBgColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    ageInYears: 3,
    linkedParents: 1,
    allergies: [],
    initial: "L",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    ageInYears: 2,
    linkedParents: 1,
    allergies: [],
    initial: "O",
    avatarBgColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
  },
];
