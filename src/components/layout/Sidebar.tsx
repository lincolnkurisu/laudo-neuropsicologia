"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  BrainCircuit,
  ChevronRight,
  Settings,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, description: "Visão geral" },
  { href: "/patients",    label: "Pacientes",   icon: Users,           description: "Cadastro e perfis" },
  { href: "/evaluations", label: "Avaliações",  icon: ClipboardList,   description: "Sessões ativas" },
  { href: "/reports",     label: "Laudos",      icon: FileText,        description: "Relatórios gerados" },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName  = session?.user?.name  ?? "Psicólogo";
  const userEmail = session?.user?.email ?? "";
  const isAdmin   = session?.user?.isAdmin ?? false;

  return (
    <aside
      className="flex h-screen w-64 flex-col overflow-hidden"
      style={{ background: "hsl(var(--sidebar-bg))" }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                        bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg
                        shadow-indigo-900/50">
          <BrainCircuit className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold tracking-tight text-white">NeuroPsi</p>
          <p className="text-[11px]" style={{ color: "hsl(var(--sidebar-muted))" }}>
            Avaliação Clínica
          </p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg
                       text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Rótulo de seção ── */}
      <div className="px-4 pb-2 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest"
           style={{ color: "hsl(var(--sidebar-muted))" }}>
          Menu
        </p>
      </div>

      {/* ── Navegação ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, description }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5",
                "transition-all duration-150",
                active
                  ? "nav-item-active"
                  : "text-[hsl(var(--sidebar-text))] hover:bg-[hsl(var(--sidebar-hover))]"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                active ? "bg-indigo-500/20" : "bg-white/5 group-hover:bg-white/10"
              )}>
                <Icon className={cn(
                  "h-4 w-4",
                  active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                )} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-medium leading-none",
                  active ? "text-indigo-300" : "text-slate-200"
                )}>
                  {label}
                </p>
                <p className="mt-0.5 truncate text-[11px]"
                   style={{ color: "hsl(var(--sidebar-muted))" }}>
                  {description}
                </p>
              </div>
              {active && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-indigo-400" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Admin ── */}
      {isAdmin && (
        <div className="px-3 pb-2">
          <Link
            href="/admin"
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
              pathname.startsWith("/admin")
                ? "nav-item-active"
                : "text-[hsl(var(--sidebar-text))] hover:bg-[hsl(var(--sidebar-hover))]"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
              pathname.startsWith("/admin") ? "bg-amber-500/20" : "bg-white/5 group-hover:bg-white/10"
            )}>
              <ShieldCheck className={cn(
                "h-4 w-4",
                pathname.startsWith("/admin") ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium leading-none", pathname.startsWith("/admin") ? "text-amber-300" : "text-slate-200")}>
                Administração
              </p>
              <p className="mt-0.5 truncate text-[11px]" style={{ color: "hsl(var(--sidebar-muted))" }}>
                Gerenciar usuários
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* ── Rodapé: Usuário ── */}
      <div className="mt-auto" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
        >
          <Avatar name={userName} size="sm" className="ring-2 ring-indigo-500/30" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{userName}</p>
            <p className="truncate text-[11px]" style={{ color: "hsl(var(--sidebar-muted))" }}>
              {userEmail}
            </p>
          </div>
          <Settings className="h-3.5 w-3.5 shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-hidden="true" />
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left
                     transition-colors hover:bg-white/5"
          style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
        >
          <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="text-sm" style={{ color: "hsl(var(--sidebar-muted))" }}>
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
