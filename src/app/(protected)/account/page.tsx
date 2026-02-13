"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

type FeedbackMsg = { type: "success" | "error"; text: string } | null;

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const supabase = createClient();

  // ---- Avatar state ----
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<FeedbackMsg>(null);

  // ---- Pseudo state ----
  const [pseudo, setPseudo] = useState("");
  const [pseudoSaving, setPseudoSaving] = useState(false);
  const [pseudoMsg, setPseudoMsg] = useState<FeedbackMsg>(null);

  // ---- Password state ----
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<FeedbackMsg>(null);

  // Sync pseudo from profile
  useEffect(() => {
    if (profile) setPseudo(profile.pseudo);
  }, [profile]);

  // ---- Avatar handlers ----
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: "error", text: "La taille maximale est de 2 Mo." });
      return;
    }

    setAvatarUploading(true);
    setAvatarMsg(null);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setAvatarMsg({ type: "error", text: uploadError.message });
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      setAvatarMsg({ type: "error", text: updateError.message });
    } else {
      setAvatarMsg({ type: "success", text: "Photo de profil mise à jour." });
      await refreshProfile();
    }

    setAvatarUploading(false);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleAvatarRemove() {
    if (!user || !profile?.avatar_url) return;

    setAvatarUploading(true);
    setAvatarMsg(null);

    // List files in user's avatar folder, then remove them
    const { data: files } = await supabase.storage
      .from("avatars")
      .list(user.id);

    if (files && files.length > 0) {
      await supabase.storage
        .from("avatars")
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (error) {
      setAvatarMsg({ type: "error", text: error.message });
    } else {
      setAvatarMsg({ type: "success", text: "Photo de profil supprimée." });
      await refreshProfile();
    }

    setAvatarUploading(false);
  }

  // ---- Pseudo handler ----
  async function handlePseudoSave() {
    if (!user) return;

    const trimmed = pseudo.trim();
    if (trimmed.length < 2) {
      setPseudoMsg({ type: "error", text: "Le pseudo doit contenir au moins 2 caractères." });
      return;
    }
    if (trimmed.length > 30) {
      setPseudoMsg({ type: "error", text: "Le pseudo ne peut pas dépasser 30 caractères." });
      return;
    }
    if (trimmed === profile?.pseudo) {
      setPseudoMsg({ type: "error", text: "Le pseudo est identique." });
      return;
    }

    setPseudoSaving(true);
    setPseudoMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ pseudo: trimmed })
      .eq("id", user.id);

    if (error) {
      setPseudoMsg({ type: "error", text: error.message });
    } else {
      setPseudoMsg({ type: "success", text: "Pseudo mis à jour." });
      await refreshProfile();
    }

    setPseudoSaving(false);
  }

  // ---- Password handler ----
  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    setPasswordSaving(true);
    setPasswordMsg(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setPasswordMsg({ type: "success", text: "Mot de passe modifié avec succès." });
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordSaving(false);
  }

  if (loading || !profile || !user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#0070f3] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Mon compte
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Gère ton profil et tes paramètres.
        </p>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Photo de profil
        </h2>

        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.pseudo}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#e2e8f0]"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full bg-[#0070f3] flex items-center justify-center text-3xl font-bold text-white shrink-0"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {profile.pseudo.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              className="px-4 py-2 rounded-[12px] text-sm font-semibold text-white bg-[#0070f3] hover:bg-[#005ec4] transition-colors disabled:opacity-50"
            >
              {avatarUploading ? "Envoi en cours..." : "Changer la photo"}
            </button>
            {profile.avatar_url && (
              <button
                onClick={handleAvatarRemove}
                disabled={avatarUploading}
                className="px-4 py-2 rounded-[12px] text-sm font-semibold text-[#ef4444] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="text-[10px] text-[#94a3b8]">JPG, PNG, WebP ou GIF. 2 Mo max.</p>
          </div>
        </div>

        {avatarMsg && (
          <p className={`mt-3 text-sm ${avatarMsg.type === "success" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            {avatarMsg.text}
          </p>
        )}
      </div>

      {/* Pseudo section */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Pseudo
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={30}
            className="flex-1 px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/10 transition-all"
            placeholder="Ton pseudo"
          />
          <button
            onClick={handlePseudoSave}
            disabled={pseudoSaving || pseudo.trim() === profile.pseudo}
            className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white bg-[#0070f3] hover:bg-[#005ec4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pseudoSaving ? "..." : "Enregistrer"}
          </button>
        </div>

        {pseudoMsg && (
          <p className={`mt-3 text-sm ${pseudoMsg.type === "success" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            {pseudoMsg.text}
          </p>
        )}
      </div>

      {/* Password section */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Mot de passe
        </h2>

        <div className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/10 transition-all"
            placeholder="Nouveau mot de passe"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-[12px] border border-[#e2e8f0] text-sm text-[#0f172a] outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/10 transition-all"
            placeholder="Confirmer le mot de passe"
          />
          <button
            onClick={handlePasswordChange}
            disabled={passwordSaving || !newPassword || !confirmPassword}
            className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white bg-[#0070f3] hover:bg-[#005ec4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordSaving ? "..." : "Changer le mot de passe"}
          </button>
        </div>

        {passwordMsg && (
          <p className={`mt-3 text-sm ${passwordMsg.type === "success" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            {passwordMsg.text}
          </p>
        )}
      </div>

      {/* Email info */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Email
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] text-sm text-[#64748b]">
            {user.email}
          </div>
          <span className="text-[10px] text-[#94a3b8] shrink-0">Non modifiable</span>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Informations
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#64748b]">Membre depuis</span>
            <span className="text-sm font-semibold text-[#0f172a]">
              {new Date(profile.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#f1f5f9]">
            <span className="text-sm text-[#64748b]">Niveau</span>
            <span className="text-sm font-semibold text-[#0f172a]">
              {profile.current_level} — {profile.current_title}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#f1f5f9]">
            <span className="text-sm text-[#64748b]">XP total</span>
            <span className="text-sm font-semibold text-[#0070f3]">
              {profile.xp_total.toLocaleString("fr-FR")} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
