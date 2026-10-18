import { notFound } from "next/navigation";
import { KidProfile } from "../../(components)/kid-profile";
import { getKidById } from "@/lib/kids-db";

export const instant = false;

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let kid = null;
  try {
    kid = await getKidById(id);
  } catch {
    // Invalid uuid syntax or query failure: the child does not resolve.
    kid = null;
  }

  if (!kid) {
    notFound();
  }

  return <KidProfile kid={kid} />;
}
