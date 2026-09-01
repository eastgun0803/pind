"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import {
  MapPin,
  LogIn,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react";

import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavbarProps {
  user: SupabaseUser | null;
  isCreator: boolean;
  onLogout: () => void;
}

export function Navbar({ user, isCreator, onLogout }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (user?.email ?? "U")[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <button onClick={() => router.push("/")} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">Pind</span>
        </button>
        <div className="flex items-center gap-2">
          {isCreator && (
            <button
              onClick={() => router.push("/creator/dashboard")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> 크리에이터 대시보드
            </button>
          )}
          {!user ? (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" /> 로그인
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                  {initial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-none">{user.email}</p>
                </div>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> 내 프로필
                  </button>
                  {isCreator && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/creator/dashboard");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" /> 크리에이터 대시보드
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors border-t border-border"
                  >
                    <LogOut className="w-3.5 h-3.5" /> 로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
