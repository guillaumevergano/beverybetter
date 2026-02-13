"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { joinTeamAction, joinViaReferralAction } from "@/actions/team";

interface InviteContentProps {
  type: "referral" | "team";
  code: string;
  isLoggedIn: boolean;
  referrerName?: string;
  referrerAvatar?: string | null;
  teamName: string | null;
  membersCount: number;
  maxMembers: number;
}

export function InviteContent({
  type,
  code,
  isLoggedIn,
  referrerName,
  referrerAvatar,
  teamName,
  membersCount,
  maxMembers,
}: InviteContentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isFull = teamName ? membersCount >= maxMembers : false;

  async function handleJoin() {
    setError("");
    setLoading(true);

    if (type === "referral") {
      const result = await joinViaReferralAction(code);
      if (!result.success) {
        setError(result.error ?? "Erreur inconnue");
        setLoading(false);
        return;
      }
    } else {
      const result = await joinTeamAction(code);
      if (!result.success) {
        setError(result.error ?? "Erreur inconnue");
        setLoading(false);
        return;
      }
    }

    router.push("/team");
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
          <p className="text-[#64748b]">
            {type === "referral"
              ? "Tu as ete invite a rejoindre la plateforme"
              : "Tu as ete invite a rejoindre une equipe"}
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-8">
          <div className="text-center mb-6">
            {type === "referral" && referrerName ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-[#eff6ff] flex items-center justify-center mb-4 overflow-hidden">
                  {referrerAvatar ? (
                    <img src={referrerAvatar} alt="" className="w-16 h-16 object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#0070f3]">
                      {referrerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2
                  className="text-xl font-bold text-[#0f172a] mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {referrerName} t&apos;invite
                </h2>
                {teamName && (
                  <p className="text-sm text-[#64748b]">
                    Equipe {teamName} &middot; {membersCount} membre{membersCount !== 1 ? "s" : ""}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-[#eff6ff] flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <h2
                  className="text-xl font-bold text-[#0f172a] mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {teamName}
                </h2>
                <p className="text-sm text-[#64748b]">
                  {membersCount} membre{membersCount !== 1 ? "s" : ""} &middot; {maxMembers} max
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px] mb-4">
              {error}
            </div>
          )}

          {isFull && type === "team" ? (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px] text-center">
              Cette equipe est pleine.
            </div>
          ) : isLoggedIn ? (
            <Button onClick={handleJoin} loading={loading} className="w-full">
              {type === "referral" && teamName
                ? "Rejoindre l'equipe"
                : type === "referral"
                  ? "Accepter l'invitation"
                  : "Rejoindre l'equipe"}
            </Button>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/auth/login?invite=${code}`}
                className="block w-full px-5 py-2.5 text-center text-sm font-semibold rounded-[12px] bg-[#0070f3] text-white hover:bg-[#005bb5] transition-all"
              >
                Se connecter
              </Link>
              <Link
                href={`/auth/signup?invite=${code}`}
                className="block w-full px-5 py-2.5 text-center text-sm font-semibold rounded-[12px] bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-all"
              >
                Creer un compte
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
