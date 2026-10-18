import { Sidebar } from "../(components)/sidebar";
import { KidsSearch } from "../(components)/kids-search";
import { AddKidModalLauncher } from "../(components)/add-kid-modal-launcher";
import { listKids } from "@/lib/kids-db";

export const instant = false;

export default async function KidsPage() {
  const kids = await listKids();

  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[880px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="flex items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
                GESTIÓN
              </div>
              <h1 className="font-display font-semibold text-[30px] m-0 text-heading">
                Niños
              </h1>
            </div>
            <AddKidModalLauncher />
          </div>

          <KidsSearch kids={kids} />
        </div>
      </main>
    </div>
  );
}
