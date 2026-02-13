"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { formatXP } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface UserMenuProps {
  profile: Profile;
}

export function UserMenu({ profile }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { team } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] hover:bg-[#1e293b] transition-colors"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-sm font-bold">
            {profile.pseudo.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-white hidden sm:block">
          {profile.pseudo}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[12px] border border-[#e2e8f0] shadow-lg py-2 z-50 animate-fade-in">
          <div className="px-4 py-2 border-b border-[#e2e8f0]">
            <p className="text-sm font-semibold text-[#0f172a]">{profile.pseudo}</p>
            <p className="text-xs text-[#64748b]">{formatXP(profile.xp_total)}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            Mon profil
          </Link>
          <Link
            href="/team"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            {team ? "Mon equipe" : "Equipe"}
          </Link>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            Mon compte
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
          >
            Se deconnecter
          </button>
        </div>
      )}
    </div>
  );
}
