import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-paper">MASKELL PRODUCTIONS</h1>
        <p className="text-paper/60 mt-1">Admin Sign In</p>
      </div>

      <Suspense fallback={<div className="text-paper/40 text-center">Loading...</div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-paper/40 text-xs mt-8">
        Site workers don't need to sign in — use the "+ New" link to submit a Site Joint record directly.
      </p>
    </div>
  );
}
