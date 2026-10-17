import { KidProfile } from "../../(components)/kid-profile";
import { KIDS } from "@/lib/mock-kids";

export const instant = false;

export function generateStaticParams() {
  return KIDS.map((kid) => ({ id: kid.id }));
}

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <KidProfile kidId={id} />;
}
