"use client";

import Link from "next/link";
import { useState } from "react";

const SunIcon = (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const CheckIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const initialForm = {
  code: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  password: "contraseña",
  photoConsent: true,
};

const labelClass = "text-[12px] font-bold tracking-[0.7px] text-muted mb-[8px]";
const inputClass =
  "w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-input-border bg-white text-[15px] text-heading mb-[18px] focus:outline-none placeholder:text-placeholder";

export function ActivateAccountForm() {
  const [code, setCode] = useState(initialForm.code);
  const [email, setEmail] = useState(initialForm.email);
  const [password, setPassword] = useState(initialForm.password);
  const [photoConsent, setPhotoConsent] = useState(initialForm.photoConsent);

  return (
    <div className="w-full max-w-[440px]">
      <div
        className="w-[58px] h-[58px] rounded-[18px] mb-[22px] flex items-center justify-center shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]"
        style={{
          background:
            "linear-gradient(155deg, var(--logo-gradient-from), var(--logo-gradient-to))",
        }}
      >
        {SunIcon}
      </div>

      <h1 className="font-display font-semibold text-[32px] leading-[1.15] m-0 mb-[8px] text-heading">
        Bienvenida a OpenDayCare
      </h1>
      <p className="m-0 mb-[26px] text-muted text-[15.5px] leading-[1.55]">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
        activar la cuenta.
      </p>

      <div className="flex items-center gap-[14px] bg-white border-[1.5px] border-input-border rounded-[16px] px-[16px] py-[14px] mb-[22px]">
        <div className="w-[44px] h-[44px] rounded-full bg-[#a9d9e8] text-[#1f7a93] font-display font-semibold text-[19px] flex items-center justify-center">
          M
        </div>
        <div>
          <div className="text-[13px] text-muted">Te invitaron a seguir a</div>
          <div className="font-display font-semibold text-[17px] text-heading">
            Mateo · Sala Soles
          </div>
        </div>
      </div>

      <div className={labelClass}>CÓDIGO DE INVITACIÓN</div>
      <input
        type="text"
        maxLength={5}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className={`${inputClass} font-display text-[18px] tracking-[3px] font-bold`}
      />

      <div className={labelClass}>EMAIL</div>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={inputClass}
      />

      <div className={labelClass}>CREAR CONTRASEÑA</div>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={`${inputClass} border-[#f2a78e]`}
      />

      <label className="flex items-start gap-[12px] bg-consent-bg rounded-[14px] px-[16px] py-[14px] mb-[24px] cursor-pointer">
        <input
          type="checkbox"
          checked={photoConsent}
          onChange={(event) => setPhotoConsent(event.target.checked)}
          className="sr-only"
        />
        <span
          className={`flex-none w-[24px] h-[24px] rounded-[8px] mt-[1px] flex items-center justify-center ${
            photoConsent ? "bg-consent-check" : "bg-transparent border-[1.5px] border-[#c9bda6]"
          }`}
        >
          {photoConsent ? CheckIcon : null}
        </span>
        <span className="text-[14px] text-consent-text leading-[1.45]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
          de la app.
        </span>
      </label>

      <Link
        href="/login"
        className="block text-center w-full py-[15px] rounded-[15px] bg-[linear-gradient(180deg,var(--compose-gradient-from),var(--compose-gradient-to))] text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
      >
        Activar mi cuenta
      </Link>

      <p className="text-center mt-[22px] m-0 text-muted text-[14.5px]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary-strong font-extrabold">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
