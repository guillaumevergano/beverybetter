"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";



export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const inviteCode = searchParams.get("invite");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : authError.message);
      setLoading(false);
      return;
    }

    if (inviteCode) {
      router.push(`/invite/${inviteCode}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  const signupHref = inviteCode ? `/auth/signup?invite=${inviteCode}` : "/auth/signup";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8fafc]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[#0f172a] mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="text-[#0070f3]">B</span>e Very Better
          </h1>
          <p className="text-[#64748b]">Connecte-toi pour continuer</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] border border-[#e2e8f0] p-8 space-y-5"
        >
          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px] animate-shake">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#0f172a] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#0f172a] mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Se connecter
          </Button>

          <p className="text-center text-sm text-[#64748b]">
            Pas encore de compte ?{" "}
            <Link
              href={signupHref}
              className="text-[#0070f3] font-medium hover:underline"
            >
              Inscris-toi
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
