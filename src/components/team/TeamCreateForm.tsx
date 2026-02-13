"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createTeamAction } from "@/actions/team";
import { useAuth } from "@/hooks/useAuth";
import { TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH } from "@/lib/constants";

export function TeamCreateForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshTeam } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createTeamAction(name, description || undefined);

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      setLoading(false);
      return;
    }

    await refreshTeam();
    router.push("/team");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px]">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="team-name" className="block text-sm font-medium text-[#0f172a] mb-1.5">
          Nom de l&apos;equipe *
        </label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={TEAM_NAME_MIN_LENGTH}
          maxLength={TEAM_NAME_MAX_LENGTH}
          className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all"
          placeholder="Les Devs Fous"
        />
        <p className="text-xs text-[#94a3b8] mt-1">{name.length}/{TEAM_NAME_MAX_LENGTH}</p>
      </div>

      <div>
        <label htmlFor="team-desc" className="block text-sm font-medium text-[#0f172a] mb-1.5">
          Description (optionnelle)
        </label>
        <textarea
          id="team-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          rows={3}
          className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent transition-all resize-none"
          placeholder="Une courte description de votre equipe..."
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Creer l&apos;equipe
      </Button>
    </form>
  );
}
