import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import type { UserCertification, Profile, Technology } from "@/types";

interface PageProps {
  params: Promise<{ certNumber: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { certNumber } = await params;
  const supabase = await createServiceClient();

  // Fetch certification
  const { data: certData } = await supabase
    .from("user_certifications")
    .select("*")
    .eq("cert_number", certNumber)
    .single();

  if (!certData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Certificat introuvable
          </h1>
          <p className="text-[#64748b]">
            Le numéro de certificat <strong>{certNumber}</strong> n&apos;existe pas
            dans notre base de données.
          </p>
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0070f3] hover:opacity-90 transition-all"
          >
            Visiter Be Very Better
          </Link>
        </div>
      </div>
    );
  }

  const cert = certData as UserCertification;

  // Fetch user profile and technology
  const [{ data: profileData }, { data: techData }] = await Promise.all([
    supabase.from("profiles").select("pseudo").eq("id", cert.user_id).single(),
    supabase.from("technologies").select("name, icon, color").eq("id", cert.technology_id).single(),
  ]);

  const profile = profileData as Pick<Profile, "pseudo"> | null;
  const tech = techData as Pick<Technology, "name" | "icon" | "color"> | null;

  const percentage = Math.round((cert.score / cert.total) * 100);
  const date = new Date(cert.certified_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="text-[#0070f3]">B</span> Be Very Better
          </span>
        </div>

        {/* Certificate card */}
        <div className="bg-white rounded-[20px] border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Top bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#0070f3] via-[#10b981] to-[#f59e0b]" />

          <div className="p-8 text-center space-y-6">
            {/* Verification badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0fdf4] border border-[#10b981]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              <span className="text-sm font-semibold text-[#065f46]">Certificat authentique</span>
            </div>

            {/* User + tech */}
            <div>
              <p className="text-sm text-[#64748b]">Ce certificat atteste que</p>
              <h1
                className="text-3xl font-bold text-[#0070f3] mt-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {profile?.pseudo ?? "Utilisateur"}
              </h1>
              <p className="text-[#64748b] mt-2">
                a démontré sa maîtrise de
              </p>
              <p className="text-xl font-bold text-[#0f172a] mt-1">
                {tech?.icon} {tech?.name}
              </p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p
                  className="text-2xl font-bold text-[#0f172a]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {percentage}%
                </p>
                <p className="text-xs text-[#94a3b8]">Score</p>
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-bold text-[#0f172a]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {cert.score}/{cert.total}
                </p>
                <p className="text-xs text-[#94a3b8]">Réponses</p>
              </div>
            </div>

            {/* Mention */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#fef3c7] text-[#92400e] font-semibold">
              🏅 Mention : {cert.mention}
            </div>

            {/* Footer info */}
            <div className="pt-4 border-t border-[#e2e8f0] text-xs text-[#94a3b8] space-y-1">
              <p>Délivré le {date}</p>
              <p className="font-semibold text-[#64748b]">N° {cert.cert_number}</p>
            </div>
          </div>
        </div>

        {/* Authenticity message */}
        <p className="text-center text-xs text-[#94a3b8]">
          Ce certificat est authentique et a été délivré par Be Very Better.
        </p>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0070f3] hover:opacity-90 transition-all"
          >
            Découvrir Be Very Better
          </Link>
        </div>
      </div>
    </div>
  );
}
