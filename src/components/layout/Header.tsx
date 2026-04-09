"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Mapeamento de rotas → título + breadcrumbs ───────────────────────────────

const ROUTE_META: Record<string, { title: string; crumb: string }> = {
  "/dashboard":            { title: "Dashboard",      crumb: "Início" },
  "/patients":             { title: "Pacientes",      crumb: "Pacientes" },
  "/patients/new":         { title: "Novo Paciente",  crumb: "Pacientes / Novo" },
  "/evaluations":          { title: "Avaliações",     crumb: "Avaliações" },
  "/reports":              { title: "Laudos",         crumb: "Laudos" },
  "/settings":             { title: "Configurações",  crumb: "Configurações" },
};

function resolveMeta(pathname: string) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith("/patients/") && pathname.includes("/anamnesis"))
    return { title: "Anamnese", crumb: "Pacientes / Anamnese" };
  if (pathname.startsWith("/patients/"))
    return { title: "Perfil do Paciente", crumb: "Pacientes / Perfil" };
  if (pathname.startsWith("/evaluations/"))
    return { title: "Avaliação", crumb: "Avaliações / Detalhe" };
  if (pathname.startsWith("/reports/"))
    return { title: "Laudo", crumb: "Laudos / Visualizar" };
  return { title: "NeuroPsi", crumb: "" };
}

// ─── Data formatada ───────────────────────────────────────────────────────────

function getTodayLabel(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();
  const { title, crumb } = resolveMeta(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between
                       border-b bg-white/80 backdrop-blur-sm px-6 gap-4">

      {/* ── Título + breadcrumb ── */}
      <div>
        {crumb && (
          <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
            {crumb.includes("/") ? (
              <>
                <Link href={`/${crumb.split("/")[0].trim().toLowerCase()}`}
                      className="hover:text-primary transition-colors">
                  {crumb.split("/")[0].trim()}
                </Link>
                <span className="mx-1 opacity-40">/</span>
                <span>{crumb.split("/")[1]?.trim()}</span>
              </>
            ) : crumb}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
      </div>

      {/* ── Ações do header ── */}
      <div className="flex items-center gap-2">
        {/* Data */}
        <span className="hidden md:block text-xs text-muted-foreground capitalize mr-2">
          {getTodayLabel()}
        </span>

        {/* Busca global (placeholder) */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg
                     border border-border bg-background text-muted-foreground
                     transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Busca global"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Notificações */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg
                     border border-border bg-background text-muted-foreground
                     transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {/* Badge de notificação */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full
                           bg-indigo-500 ring-2 ring-white" />
        </button>

        {/* Ação principal contextual */}
        <Button size="sm" asChild className="gap-1.5 shadow-sm">
          <Link href="/patients/new">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Novo Paciente
          </Link>
        </Button>
      </div>
    </header>
  );
}
