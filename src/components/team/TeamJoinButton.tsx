"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { joinTeamAction } from "@/actions/team";

interface TeamJoinButtonProps {
  inviteCode: string;
}

export function TeamJoinButton({ inviteCode }: TeamJoinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleJoin() {
    setError("");
    setLoading(true);

    const result = await joinTeamAction(inviteCode);

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      setLoading(false);
      return;
    }

    router.push("/team");
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px] mb-3">
          {error}
        </div>
      )}
      <Button onClick={handleJoin} loading={loading} className="w-full">
        Rejoindre l&apos;equipe
      </Button>
    </div>
  );
}
