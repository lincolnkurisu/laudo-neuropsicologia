import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const mockReports = [
  {
    id: "e3",
    patientName: "Fernanda Costa Lima",
    patientId: "3",
    title: "Avaliação Neuropsicológica Completa",
    generatedAt: new Date("2026-03-21"),
    tests: ["ASRS-18", "BPA-2", "WASI", "FDT", "BFP"],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laudos</h1>
        <p className="text-muted-foreground">Laudos neuropsicológicos gerados.</p>
      </div>

      {mockReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum laudo gerado ainda.</p>
            <p className="text-sm mt-1">Conclua uma avaliação para gerar o laudo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mockReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{report.title}</span>
                    <Badge variant="success">Laudo gerado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paciente:{" "}
                    <Link href={`/patients/${report.patientId}`} className="text-primary hover:underline">
                      {report.patientName}
                    </Link>
                  </p>
                  <div className="flex gap-2 mt-2">
                    {report.tests.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Gerado em {formatDate(report.generatedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reports/${report.id}`}>Visualizar</Link>
                  </Button>
                  <Button size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
