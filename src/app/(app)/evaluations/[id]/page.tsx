import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, calculateAge } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TESTS = [
  { key: "testAsrs18", label: "ASRS-18",  description: "Rastreio de TDAH em Adultos (18 itens)" },
  { key: "testBpa2",   label: "BPA-2",    description: "Bateria de Provas de Atenção" },
  { key: "testWasi",   label: "WASI",     description: "Escala Wechsler Abreviada de Inteligência" },
  { key: "testFdt",    label: "FDT",      description: "Five Digit Test — Funções Executivas" },
  { key: "testBfp",    label: "BFP",      description: "Bateria Fatorial de Personalidade" },
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
      testBfp:   { select: { id: true } },
      testBpa2:  { select: { id: true } },
      testWasi:  { select: { id: true } },
      testFdt:   { select: { id: true } },
    },
  });

  if (!ev) notFound();

  const cfg = STATUS_CONFIG[ev.status];
  const testsDone = TESTS.filter((t) => ev[t.key] !== null).length;
  const progress = Math.round((testsDone / TESTS.length) * 100);

  return (
    <div className="max-w-3xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/patients" className="hover:text-primary">Pacientes</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/patients/${ev.patient.id}`} className="hover:text-primary">
          {ev.patient.fullName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>Avaliação</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={ev.patient.fullName} size="lg" />
          <div>
            <h1 className="text-xl font-bold">{ev.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ev.patient.fullName}
              {ev.patient.dateOfBirth && ` · ${calculateAge(ev.patient.dateOfBirth)} anos`}
            </p>
            <p className="text-xs text-muted-foreground">Iniciada em {formatDate(ev.createdAt)}</p>
          </div>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      {/* Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso da Avaliação</CardTitle>
          <CardDescription>{testsDone} de {TESTS.length} testes aplicados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-2">
            {TESTS.map((test) => {
              const done = ev[test.key] !== null;
              return (
                <div key={test.key}
                  className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                    <div>
                      <p className="font-medium text-sm">{test.label}</p>
                      <p className="text-xs text-muted-foreground">{test.description}</p>
                    </div>
                  </div>
                  <Badge variant={done ? "success" : "secondary"} className="text-xs">
                    {done ? "Aplicado" : "Pendente"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" asChild>
          <Link href={`/patients/${ev.patient.id}`}>Voltar ao Paciente</Link>
        </Button>
        {testsDone === TESTS.length && (
          <Button asChild>
            <Link href={`/reports/${ev.id}`}>Gerar Laudo PDF</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
