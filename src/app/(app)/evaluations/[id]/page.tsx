import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

// Mock da avaliação
async function getEvaluation(id: string) {
  const evals: Record<string, object> = {
    "e1": {
      id: "e1",
      title: "Avaliação Neuropsicológica Completa",
      status: "IN_PROGRESS",
      createdAt: new Date("2026-04-03"),
      patient: { id: "1", fullName: "Ana Beatriz Silva", age: 34 },
      tests: {
        asrs18:  { done: true,  label: "ASRS-18",  description: "Rastreio de TDAH em Adultos" },
        bpa2:    { done: true,  label: "BPA-2",    description: "Bateria de Provas de Atenção" },
        wasi:    { done: false, label: "WASI",     description: "Escala Wechsler Abreviada de Inteligência" },
        fdt:     { done: false, label: "FDT",      description: "Five Digit Test (Funções Executivas)" },
        bfp:     { done: false, label: "BFP",      description: "Bateria Fatorial de Personalidade" },
      },
    },
  };
  return evals[id] || null;
}

interface EvaluationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EvaluationPage({ params }: EvaluationPageProps) {
  const { id } = await params;
  const evaluation = await getEvaluation(id) as {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    patient: { id: string; fullName: string; age: number };
    tests: Record<string, { done: boolean; label: string; description: string }>;
  } | null;

  if (!evaluation) notFound();

  const testEntries = Object.entries(evaluation.tests);
  const completedCount = testEntries.filter(([, t]) => t.done).length;
  const totalCount = testEntries.length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/patients" className="hover:underline">Pacientes</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/patients/${evaluation.patient.id}`} className="hover:underline">
              {evaluation.patient.fullName}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span>Avaliação</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{evaluation.title}</h1>
          <p className="text-muted-foreground">
            Paciente: {evaluation.patient.fullName} · Iniciada em {formatDate(evaluation.createdAt)}
          </p>
        </div>
        <Badge variant={evaluation.status === "IN_PROGRESS" ? "warning" : "success"}>
          {evaluation.status === "IN_PROGRESS" ? "Em andamento" : "Concluída"}
        </Badge>
      </div>

      {/* Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso da Avaliação</CardTitle>
          <CardDescription>{completedCount} de {totalCount} testes aplicados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {testEntries.map(([key, test]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  {test.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{test.label}</p>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  </div>
                </div>

                <Button
                  variant={test.done ? "outline" : "default"}
                  size="sm"
                  asChild
                >
                  <Link href={`/evaluations/${evaluation.id}/tests/${key}`}>
                    {test.done ? "Revisar" : "Aplicar"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button variant="outline" asChild>
          <Link href={`/patients/${evaluation.patient.id}`}>Voltar ao Paciente</Link>
        </Button>
        {completedCount === totalCount && (
          <Button asChild>
            <Link href={`/reports/${evaluation.id}`}>Gerar Laudo PDF</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
