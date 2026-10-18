"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const GENERIC_ERROR = "Credenciales inválidas";
const FOCUS_RING =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5503a] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

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
      <p className="m-0 mb-[28px] text-[#756a5d] text-[15px]">
        Ingresá para ver el día de hoy.
      </p>

      <label
        htmlFor="login-email"
        className="block text-[12px] font-bold tracking-[0.7px] text-heading mb-[8px]"
      >
        EMAIL
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={`w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border-strong bg-white text-[15px] text-heading mb-[18px] placeholder:text-[#756a5d] disabled:opacity-60 ${FOCUS_RING}`}
        disabled={submitting}
      />

      <label
        htmlFor="login-password"
        className="block text-[12px] font-bold tracking-[0.7px] text-heading mb-[8px]"
      >
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={`w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border-strong bg-white text-[15px] text-heading mb-[10px] placeholder:text-[#756a5d] disabled:opacity-60 ${FOCUS_RING}`}
        disabled={submitting}
      />

      <div className="text-right mb-[20px]">
        <a
          href="/reset-password"
          className="text-primary-strong-darker text-[13.5px] font-bold underline underline-offset-2"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {error ? (
        <p
          role="alert"
          id="login-error"
          aria-live="assertive"
          className="m-0 mb-[14px] text-[13.5px] font-bold text-[#a5391f]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        aria-describedby={error ? "login-error" : undefined}
        disabled={submitting}
        className="block w-full py-[15px] rounded-[15px] bg-primary-strong-darker text-white font-extrabold text-[16px] cursor-pointer shadow-[0_10px_22px_-8px_rgba(179,74,53,0.7)] disabled:opacity-70 disabled:cursor-wait hover:bg-[#7e3a26] disabled:hover:bg-primary-strong-darker"
      >
        {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>

      <p className="text-center mt-[24px] m-0 text-[#756a5d] text-[14.5px]">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="text-primary-strong-darker font-extrabold underline underline-offset-2"
        >
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
