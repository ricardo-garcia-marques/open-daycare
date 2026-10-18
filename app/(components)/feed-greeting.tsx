"use client";

import { useCurrentUser } from "@/lib/user-store";

export function FeedGreeting() {
  const user = useCurrentUser();
  const firstName =
    user.status === "ready" ? user.fullName.split(" ")[0] : null;

  return (
    <h1 className="font-display font-semibold text-[30px] m-0 text-heading">
      {firstName ? `Buenas, ${firstName}` : "Buenas…"}
    </h1>
  );
}
