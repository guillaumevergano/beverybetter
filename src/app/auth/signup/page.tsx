"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pseudo },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

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
          <p className="text-[#64748b]">Crée ton compte pour commencer</p>
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
              htmlFor="pseudo"
              className="block text-sm font-medium text-[#0f172a] mb-1.5"
            >
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              required
              minLength={2}
              maxLength={30}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
              placeholder="Ton pseudo"
            />
          </div>

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
              placeholder="6 caractères minimum"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Créer mon compte
          </Button>

          <p className="text-center text-sm text-[#64748b]">
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="text-[#0070f3] font-medium hover:underline"
            >
              Connecte-toi
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
