import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { STATUS_CONFIG, type EvaluationStatusKey } from "@/lib/constants";

const MOCK_EVALUATIONS: Array<{
  id: string;
  title: string;
  patientName: string;
  patientId: string;
  status: EvaluationStatusKey;
  createdAt: Date;
  testsApplied: string[];
}> = [
  {
    id: "e1",
    title: "Avaliação Neuropsicológica Completa",
    patientName: "Ana Beatriz Silva",
    patientId: "1",
    status: "IN_PROGRESS",
    createdAt: new Date("2026-04-03"),
    testsApplied: ["ASRS-18", "BPA-2"],
  },
  {
    id: "e2",
    title: "Avaliação Neuropsicológica Completa",
    patientName: "Carlos Eduardo Mendes",
    patientId: "2",
    status: "COMPLETED",
    createdAt: new Date("2026-03-28"),
    testsApplied: ["ASRS-18", "BPA-2", "WASI"],
  },
];

export default function EvaluationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground">
            {MOCK_EVALUATIONS.length} avaliações registradas
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_EVALUATIONS.map((ev) => {
          const cfg = STATUS_CONFIG[ev.status];
          return (
            <Card key={ev.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{ev.title}</span>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paciente:{" "}
                    <Link
                      href={`/patients/${ev.patientId}`}
                      className="text-primary hover:underline"
                    >
                      {ev.patientName}
                    </Link>
                  </p>
                  <div className="flex gap-2 mt-2">
                    {ev.testsApplied.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Iniciada em {formatDate(ev.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/evaluations/${ev.id}`}>Abrir</Link>
                  </Button>
                  {ev.status === "COMPLETED" && (
                    <Button size="sm" asChild>
                      <Link href={`/reports/${ev.id}`}>Gerar Laudo</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
