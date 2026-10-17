import { LoginForm } from "../(components)/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-[1.05fr_1fr] bg-auth-bg">
      <div />
      <div className="flex items-center justify-center px-10 py-10">
        <LoginForm />
      </div>
    </div>
  );
}
