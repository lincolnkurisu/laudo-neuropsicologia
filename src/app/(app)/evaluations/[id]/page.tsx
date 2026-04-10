import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, ChevronRight, ClipboardEdit, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, calculateAge } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTestRecommendations, type TestRecommendation } from "@/lib/recommendations";

const TESTS = [
  // ── Cognitivo / Inteligência ──────────────────────────────────────────────
  { key: "testWasi",         label: "WASI",            slug: "wasi",          description: "Escala Wechsler Abreviada de Inteligência",          group: "Cognitivo" },
  { key: "testMoca",         label: "MoCA",            slug: "moca",          description: "Montreal Cognitive Assessment — triagem cognitiva",   group: "Cognitivo" },
  // ── Memória ───────────────────────────────────────────────────────────────
  { key: "testRavlt",        label: "RAVLT",           slug: "ravlt",         description: "Aprendizagem Auditivo-Verbal de Rey",                 group: "Memória" },
  { key: "testRey",          label: "Rey",             slug: "rey",           description: "Figura Complexa de Rey — memória visuoespacial",      group: "Memória" },
  // ── Atenção / Funções Executivas ─────────────────────────────────────────
  { key: "testBpa2",         label: "BPA-2",           slug: "bpa2",          description: "Bateria de Provas de Atenção",                        group: "Atenção" },
  { key: "testFdt",          label: "FDT",             slug: "fdt",           description: "Five Digit Test — inibição e flexibilidade",           group: "Atenção" },
  { key: "testTmt",          label: "TMT A/B",         slug: "tmt",           description: "Trail Making Test — atenção e funções executivas",     group: "Atenção" },
  { key: "testCtp",          label: "CTP",             slug: "ctp",           description: "Teste de Performance Contínua — atenção sustentada",  group: "Atenção" },
  { key: "testWcst",         label: "WCST",            slug: "wcst",          description: "Wisconsin Card Sorting Test — flexibilidade cognitiva", group: "Executivo" },
  { key: "testTorreLondres", label: "Torre de Londres", slug: "torre-londres", description: "Torre de Londres — planejamento e resolução de problemas", group: "Executivo" },
  { key: "testFluencia",     label: "Fluência",        slug: "fluencia",      description: "Fluência Verbal Fonêmica (FAS) e Semântica",           group: "Linguagem" },
  // ── Humor / Personalidade ─────────────────────────────────────────────────
  { key: "testBdi2",         label: "BDI-II",          slug: "bdi2",          description: "Inventário de Depressão de Beck (21 itens)",           group: "Humor" },
  { key: "testBai",          label: "BAI",             slug: "bai",           description: "Inventário de Ansiedade de Beck (21 itens)",           group: "Humor" },
  { key: "testAsrs18",       label: "ASRS-18",         slug: "asrs18",        description: "Rastreio de TDAH em Adultos (18 itens)",               group: "TDAH" },
  { key: "testDiva2",        label: "DIVA 2.0",        slug: "diva2",         description: "Entrevista diagnóstica estruturada para TDAH (DSM-5)", group: "TDAH" },
  { key: "testCaars",        label: "CAARS",           slug: "caars",         description: "Conners' Adult ADHD Rating Scales",                    group: "TDAH" },
  { key: "testMfft",         label: "MFFT-BR",         slug: "mfft",          description: "Matching Familiar Figures Test — impulsividade",       group: "TDAH" },
  { key: "testBfp",          label: "BFP",             slug: "bfp",           description: "Bateria Fatorial de Personalidade",                    group: "Personalidade" },
] as const;

const PRIORITY_CONFIG = {
  essencial:    { label: "Essencial",    variant: "destructive" as const, dot: "bg-red-500" },
  recomendado:  { label: "Recomendado",  variant: "default"     as const, dot: "bg-indigo-500" },
  opcional:     { label: "Opcional",     variant: "secondary"   as const, dot: "bg-gray-400" },
};

interface Props { params: Promise<{ id: string }> }

export default async function EvaluationPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const ev = await prisma.evaluation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          educationLevel: true,
          anamneses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              mainComplaint: true,
              complaintDuration: true,
              medicalHistory: true,
              learningDifficulties: true,
              familyHistory: true,
              currentMedications: true,
              schoolHistory: true,
              clinicalObservations: true,
              behaviorDuringSession: true,
              recentLifeEvents: true,
            },
          },
        },
      },
      testAsrs18:       { select: { id: true } },
      testBfp:          { select: { id: true } },
      testBpa2:         { select: { id: true } },
      testWasi:         { select: { id: true } },
      testFdt:          { select: { id: true } },
      testRavlt:        { select: { id: true } },
      testMoca:         { select: { id: true } },
      testBdi2:         { select: { id: true } },
      testBai:          { select: { id: true } },
      testTmt:          { select: { id: true } },
      testRey:          { select: { id: true } },
      testFluencia:     { select: { id: true } },
      testDiva2:        { select: { id: true } },
      testCaars:        { select: { id: true } },
      testCtp:          { select: { id: true } },
      testWcst:         { select: { id: true } },
      testTorreLondres: { select: { id: true } },
      testMfft:         { select: { id: true } },
    },
  });

  if (!ev) notFound();

  const cfg = STATUS_CONFIG[ev.status];
  const testsDone = TESTS.filter((t) => ev[t.key] !== null).length;
  const progress  = Math.round((testsDone / TESTS.length) * 100);

  // ── Recomendações clínicas ────────────────────────────────────────────────
  const latestAnamnesis = ev.patient.anamneses[0] ?? null;
  const patientAge = ev.patient.dateOfBirth ? calculateAge(ev.patient.dateOfBirth) : 30;
  const recommendations: TestRecommendation[] = latestAnamnesis
    ? getTestRecommendations(latestAnamnesis, patientAge, ev.patient.educationLevel)
    : [];
  const recMap = new Map(recommendations.map((r) => [r.testKey, r]));

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

      {/* Bateria Sugerida */}
      {latestAnamnesis ? (
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-indigo-500 shrink-0" />
              <CardTitle className="text-base">Bateria Sugerida</CardTitle>
            </div>
            <CardDescription>Recomendações baseadas na anamnese do paciente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec) => {
              const pCfg = PRIORITY_CONFIG[rec.priority];
              const done = ev[rec.testKey as keyof typeof ev] !== null;
              return (
                <div key={rec.testKey}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${done ? "opacity-60" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${pCfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-sm">{rec.label}</span>
                      <Badge variant={pCfg.variant} className="text-[10px] py-0 px-1.5">{pCfg.label}</Badge>
                      {done && <Badge variant="success" className="text-[10px] py-0 px-1.5">Aplicado</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rec.reasons[0]}</p>
                    {rec.reasons.length > 1 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">+{rec.reasons.length - 1} razão(ões) adicionais</p>
                    )}
                  </div>
                  {!done && (
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2.5 shrink-0">
                      <Link href={`/evaluations/${id}/tests/${rec.slug}`}>
                        <ClipboardEdit className="h-3 w-3 mr-1" />
                        Registrar
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-4">
            <Lightbulb className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Anamnese não encontrada</p>
              <p className="text-xs text-muted-foreground">
                Cadastre a anamnese do paciente para receber sugestões de bateria personalizada.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="ml-auto shrink-0">
              <Link href={`/patients/${ev.patient.id}`}>Ver Paciente</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
          {(["Cognitivo", "Memória", "Atenção", "Executivo", "Linguagem", "Humor", "TDAH", "Personalidade"] as const).map((group) => {
            const groupTests = TESTS.filter((t) => t.group === group);
            return (
              <div key={group} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">{group}</p>
                {groupTests.map((test) => {
                  const done = ev[test.key] !== null;
                  const rec  = recMap.get(test.key);
                  const pCfg = rec ? PRIORITY_CONFIG[rec.priority] : null;
                  return (
                    <div key={test.key}
                      className="flex items-center gap-3 rounded-lg border p-3 sm:p-4">
                      {done
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-medium text-sm">{test.label}</p>
                          {pCfg && (
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${pCfg.dot}`} title={pCfg.label} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground hidden sm:block">{test.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {pCfg && (
                          <Badge variant={pCfg.variant} className="text-[10px] hidden md:inline-flex">
                            {pCfg.label}
                          </Badge>
                        )}
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
