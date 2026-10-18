"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const GENERIC_ERROR = "Credenciales inválidas";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(GENERIC_ERROR);
      setSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[392px]">
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
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border bg-white text-[15px] text-heading mb-[18px] focus:outline-none placeholder:text-placeholder disabled:opacity-60"
        disabled={submitting}
      />

      <div className="text-[12px] font-bold tracking-[0.7px] text-muted mb-[8px]">
        CONTRASEÑA
      </div>
      <input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border bg-white text-[15px] text-heading mb-[10px] focus:outline-none placeholder:text-placeholder disabled:opacity-60"
        disabled={submitting}
      />

      <div className="text-right mb-[20px]">
        <span className="text-primary-strong text-[13.5px] font-bold cursor-pointer">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="m-0 mb-[14px] text-[13.5px] font-bold text-[#d9583c]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="block w-full py-[15px] rounded-[15px] bg-[linear-gradient(180deg,var(--compose-gradient-from),var(--compose-gradient-to))] text-white font-extrabold text-[16px] cursor-pointer shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-70 disabled:cursor-wait"
      >
        {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>

      <p className="text-center mt-[24px] m-0 text-muted text-[14.5px]">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="text-primary-strong font-extrabold"
        >
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
