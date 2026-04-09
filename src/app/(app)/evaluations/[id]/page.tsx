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
  { key: "testAsrs18", label: "ASRS-18",  slug: "asrs18", description: "Rastreio de TDAH em Adultos (18 itens)" },
  { key: "testBpa2",   label: "BPA-2",    slug: "bpa2",   description: "Bateria de Provas de Atenção" },
  { key: "testWasi",   label: "WASI",     slug: "wasi",   description: "Escala Wechsler Abreviada de Inteligência" },
  { key: "testFdt",    label: "FDT",      slug: "fdt",    description: "Five Digit Test — Funções Executivas" },
  { key: "testBfp",    label: "BFP",      slug: "bfp",    description: "Bateria Fatorial de Personalidade" },
  { key: "testRavlt",  label: "RAVLT",    slug: "ravlt",  description: "Teste de Aprendizagem Auditivo-Verbal de Rey" },
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
      testAsrs18: { select: { id: true } },
      testBfp:    { select: { id: true } },
      testBpa2:   { select: { id: true } },
      testWasi:   { select: { id: true } },
      testFdt:    { select: { id: true } },
      testRavlt:  { select: { id: true } },
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

          {/* Lista de testes */}
          <div className="space-y-2">
            {TESTS.map((test) => {
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
                    <Button
                      variant={done ? "outline" : "default"}
                      size="sm"
                      asChild
                      className="h-7 text-xs px-2.5"
                    >
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
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/patients/${ev.patient.id}`}>Voltar ao Paciente</Link>
        </Button>
        {testsDone === TESTS.length && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/reports/${ev.id}`}>Gerar Laudo PDF</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
