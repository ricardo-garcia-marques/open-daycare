import { LoginForm } from "../(components)/login-form";

const SunIcon = (
  <svg
    width="26"
    height="26"
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

const HeroPanel = (
  <div
    className="relative overflow-hidden flex flex-col justify-between text-white px-[60px] py-[56px]"
    style={{
      background:
        "linear-gradient(155deg, #ab5238 0%, #a85238 45%, #9c4a30 100%)",
    }}
  >
    <div className="absolute w-[420px] h-[420px] rounded-full bg-white/10 top-[-140px] right-[-120px]" />
    <div className="absolute w-[300px] h-[300px] rounded-full bg-white/10 bottom-[-110px] left-[-80px]" />

    <div className="relative flex items-center gap-[13px]">
      <div className="w-[46px] h-[46px] rounded-[14px] bg-white/20 flex items-center justify-center">
        {SunIcon}
      </div>
      <span className="font-display font-semibold text-[21px] tracking-[0.5px]">
        OpenDayCare
      </span>
    </div>

    <div className="relative">
      <h1 className="font-display font-semibold text-[42px] leading-[1.12] mb-[18px] m-0">
        El día de cada niño,
        <br />
        compartido con su familia.
      </h1>
      <p className="text-[17px] leading-[1.6] m-0 max-w-[430px] text-white/90">
        Publicá momentos, gestioná las salas y mantené a las familias cerca,
        desde un solo lugar.
      </p>
    </div>

    <div className="relative text-[14px] text-white/90">
      🌿 Guardería Sala Soles
    </div>
  </div>
);

export default function LoginPage() {
  return (
    <main className="min-h-screen grid grid-cols-[1.05fr_1fr] bg-auth-bg">
      {HeroPanel}
      <div className="flex items-center justify-center px-10 py-10">
        <LoginForm />
      </div>
    </main>
  );
}

