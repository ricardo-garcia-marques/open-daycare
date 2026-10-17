"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const initialEmail = "caro@opendaycare.com";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-[392px]">
      <h2 className="font-display font-semibold text-[30px] text-heading m-0 mb-[6px]">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-[28px] text-muted text-[15px]">
        Ingresá para ver el día de hoy.
      </p>

      <div className="text-[12px] font-bold tracking-[0.7px] text-muted mb-[8px]">
        EMAIL
      </div>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border bg-white text-[15px] text-heading mb-[18px] focus:outline-none placeholder:text-placeholder"
      />

      <div className="text-[12px] font-bold tracking-[0.7px] text-muted mb-[8px]">
        CONTRASEÑA
      </div>
      <input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border bg-white text-[15px] text-heading mb-[10px] focus:outline-none placeholder:text-placeholder"
      />

      <div className="text-right mb-[20px]">
        <span className="text-primary-strong text-[13.5px] font-bold cursor-pointer">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="block w-full py-[15px] rounded-[15px] bg-[linear-gradient(180deg,var(--compose-gradient-from),var(--compose-gradient-to))] text-white font-extrabold text-[16px] cursor-pointer shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
      >
        Iniciar sesión
      </button>
    </div>
  );
}
