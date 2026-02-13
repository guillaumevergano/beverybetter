import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateCertificateHTML } from "@/lib/generate-certificate";
import type { UserCertification, Profile, Technology } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  const supabase = await createServiceClient();

  // Fetch certification
  const { data: certData } = await supabase
    .from("user_certifications")
    .select("*")
    .eq("cert_number", certNumber)
    .single();

  if (!certData) {
    return NextResponse.json({ error: "Certificat introuvable" }, { status: 404 });
  }

  const cert = certData as UserCertification;

  // Fetch user profile and technology
  const [{ data: profileData }, { data: techData }] = await Promise.all([
    supabase.from("profiles").select("pseudo").eq("id", cert.user_id).single(),
    supabase.from("technologies").select("name, icon").eq("id", cert.technology_id).single(),
  ]);

  if (!profileData || !techData) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 500 });
  }

  const profile = profileData as Pick<Profile, "pseudo">;
  const tech = techData as Pick<Technology, "name" | "icon">;

  const html = generateCertificateHTML({
    pseudo: profile.pseudo,
    techName: tech.name,
    techIcon: tech.icon,
    score: cert.score,
    total: cert.total,
    mention: cert.mention,
    certNumber: cert.cert_number,
    certifiedAt: cert.certified_at,
    verificationUrl: cert.verification_url,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
