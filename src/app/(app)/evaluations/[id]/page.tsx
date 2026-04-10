import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, ChevronRight, ClipboardEdit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, calculateAge } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TESTS = [
  // ── Cognitivo / Inteligência ──────────────────────────────────────────────
  { key: "testWasi",     label: "WASI",      slug: "wasi",     description: "Escala Wechsler Abreviada de Inteligência",        group: "Cognitivo" },
  { key: "testMoca",     label: "MoCA",      slug: "moca",     description: "Montreal Cognitive Assessment — triagem cognitiva", group: "Cognitivo" },
  // ── Memória ───────────────────────────────────────────────────────────────
  { key: "testRavlt",    label: "RAVLT",     slug: "ravlt",    description: "Aprendizagem Auditivo-Verbal de Rey",               group: "Memória" },
  { key: "testRey",      label: "Rey",       slug: "rey",      description: "Figura Complexa de Rey — memória visuoespacial",    group: "Memória" },
  // ── Atenção / Funções Executivas ─────────────────────────────────────────
  { key: "testBpa2",     label: "BPA-2",     slug: "bpa2",     description: "Bateria de Provas de Atenção",                     group: "Atenção" },
  { key: "testFdt",      label: "FDT",       slug: "fdt",      description: "Five Digit Test — inibição e flexibilidade",        group: "Atenção" },
  { key: "testTmt",      label: "TMT A/B",   slug: "tmt",      description: "Trail Making Test — atenção e funções executivas",  group: "Atenção" },
  { key: "testFluencia", label: "Fluência",  slug: "fluencia", description: "Fluência Verbal Fonêmica (FAS) e Semântica",        group: "Linguagem" },
  // ── Humor / Personalidade ─────────────────────────────────────────────────
  { key: "testBdi2",     label: "BDI-II",    slug: "bdi2",     description: "Inventário de Depressão de Beck (21 itens)",        group: "Humor" },
  { key: "testBai",      label: "BAI",       slug: "bai",      description: "Inventário de Ansiedade de Beck (21 itens)",        group: "Humor" },
  { key: "testAsrs18",   label: "ASRS-18",   slug: "asrs18",   description: "Rastreio de TDAH em Adultos (18 itens)",            group: "Humor" },
  { key: "testBfp",      label: "BFP",       slug: "bfp",      description: "Bateria Fatorial de Personalidade",                 group: "Personalidade" },
] as const;

interface Props { params: Promise<{ id: string }> }

export default async function EvaluationPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const ev = await prisma.evaluation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      patient: { select: { id: true, fullName: true, dateOfBirth: true } },
      testAsrs18:   { select: { id: true } },
      testBfp:      { select: { id: true } },
      testBpa2:     { select: { id: true } },
      testWasi:     { select: { id: true } },
      testFdt:      { select: { id: true } },
      testRavlt:    { select: { id: true } },
      testMoca:     { select: { id: true } },
      testBdi2:     { select: { id: true } },
      testBai:      { select: { id: true } },
      testTmt:      { select: { id: true } },
      testRey:      { select: { id: true } },
      testFluencia: { select: { id: true } },
    },
  });

  if (!ev) notFound();

  const cfg = STATUS_CONFIG[ev.status];
  const testsDone = TESTS.filter((t) => ev[t.key] !== null).length;
  const progress  = Math.round((testsDone / TESTS.length) * 100);

  return (
    <div className="max-w-3xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <Link href="/patients" className="hover:text-primary">Pacientes</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/patients/${ev.patient.id}`} className="hover:text-primary truncate max-w-[120px] sm:max-w-none">
          {ev.patient.fullName}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="truncate">Avaliação</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={ev.patient.fullName} size="md" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{ev.title}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {ev.patient.fullName}
              {ev.patient.dateOfBirth && ` · ${calculateAge(ev.patient.dateOfBirth)} anos`}
            </p>
            <p className="text-xs text-muted-foreground">Iniciada em {formatDate(ev.createdAt)}</p>
          </div>
        </div>
        <Badge variant={cfg.variant} className="shrink-0">{cfg.label}</Badge>
      </div>

      {/* Progresso */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Progresso da Avaliação</CardTitle>
          <CardDescription>{testsDone} de {TESTS.length} testes aplicados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Lista de testes agrupados */}
          {(["Cognitivo", "Memória", "Atenção", "Linguagem", "Humor", "Personalidade"] as const).map((group) => {
            const groupTests = TESTS.filter((t) => t.group === group);
            return (
              <div key={group} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">{group}</p>
                {groupTests.map((test) => {
                  const done = ev[test.key] !== null;
                  return (
                    <div key={test.key}
                      className="flex items-center gap-3 rounded-lg border p-3 sm:p-4">
                      {done
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{test.label}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{test.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={done ? "success" : "secondary"} className="text-[10px] hidden sm:inline-flex">
                          {done ? "Aplicado" : "Pendente"}
                        </Badge>
                        <Button variant={done ? "outline" : "default"} size="sm" asChild className="h-7 text-xs px-2.5">
                          <Link href={`/evaluations/${id}/tests/${test.slug}`}>
                            <ClipboardEdit className="h-3 w-3 mr-1 sm:mr-1.5" />
                            {done ? "Editar" : "Registrar"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/patients/${ev.patient.id}`}>Voltar ao Paciente</Link>
        </Button>
        {testsDone > 0 && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/reports/${ev.id}`}>Gerar Laudo PDF</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
