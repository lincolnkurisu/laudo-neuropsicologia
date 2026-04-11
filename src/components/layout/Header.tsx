"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROUTE_META: Record<string, { title: string; crumb: string }> = {
  "/dashboard":   { title: "Dashboard",     crumb: "Início" },
  "/patients":    { title: "Pacientes",     crumb: "Pacientes" },
  "/patients/new":{ title: "Novo Paciente", crumb: "Pacientes / Novo" },
  "/evaluations": { title: "Avaliações",    crumb: "Avaliações" },
  "/reports":     { title: "Laudos",        crumb: "Laudos" },
  "/settings":    { title: "Configurações", crumb: "Configurações" },
};

function resolveMeta(pathname: string) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith("/patients/") && pathname.includes("/anamnesis"))
    return { title: "Anamnese",           crumb: "Pacientes / Anamnese" };
  if (pathname.startsWith("/patients/") && pathname.includes("/tests"))
    return { title: "Registrar Teste",    crumb: "Avaliações / Teste" };
  if (pathname.startsWith("/patients/"))
    return { title: "Perfil do Paciente", crumb: "Pacientes / Perfil" };
  if (pathname.startsWith("/evaluations/new"))
    return { title: "Nova Avaliação",     crumb: "Avaliações / Nova" };
  if (pathname.startsWith("/evaluations/") && pathname.includes("/tests"))
    return { title: "Registrar Teste",    crumb: "Avaliações / Teste" };
  if (pathname.startsWith("/evaluations/"))
    return { title: "Avaliação",          crumb: "Avaliações / Detalhe" };
  if (pathname.startsWith("/reports/"))
    return { title: "Laudo",              crumb: "Laudos / Visualizar" };
  return { title: "NeuroPsi", crumb: "" };
}

interface HeaderProps {
  onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const { title, crumb } = resolveMeta(pathname);

  return (
    <header className="flex h-14 md:h-16 shrink-0 items-center justify-between
                       border-b bg-white/80 backdrop-blur-sm px-4 md:px-6 gap-3 print:hidden">

      {/* ── Hamburger (mobile only) + Título ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger button — hidden on lg+ */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                     border border-border bg-background text-muted-foreground
                     transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          {crumb && (
            <p className="hidden sm:block text-[11px] font-medium text-muted-foreground
                          tracking-wide uppercase truncate">
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
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground
                         leading-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* ── Ação rápida ── */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" asChild className="gap-1.5 shadow-sm">
          <Link href="/patients/new">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Novo Paciente</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
