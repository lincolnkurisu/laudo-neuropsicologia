import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Laudos = avaliações com status REPORT_GENERATED ou COMPLETED
  const evaluations = await prisma.evaluation.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["REPORT_GENERATED", "COMPLETED"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      patient: { select: { id: true, fullName: true } },
      testAsrs18: { select: { id: true } },
      testBfp:   { select: { id: true } },
      testBpa2:  { select: { id: true } },
      testWasi:  { select: { id: true } },
      testFdt:   { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mt-1">
          {evaluations.length === 0
            ? "Nenhum laudo gerado ainda"
            : `${evaluations.length} laudo${evaluations.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium text-foreground">Nenhum laudo gerado</p>
            <p className="text-sm mt-1">
              Conclua todos os testes de uma avaliação para gerar o laudo.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/evaluations">Ver avaliações</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {evaluations.map((ev) => {
            const appliedTests = [
              ev.testAsrs18 && "ASRS-18",
              ev.testBpa2   && "BPA-2",
              ev.testWasi   && "WASI",
              ev.testFdt    && "FDT",
              ev.testBfp    && "BFP",
            ].filter(Boolean) as string[];

            return (
              <Card key={ev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={ev.patient.fullName} size="md" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{ev.title}</span>
                        <Badge variant="success" className="text-[10px] shrink-0">Laudo gerado</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        <Link href={`/patients/${ev.patient.id}`}
                          className="text-primary hover:underline font-medium">
                          {ev.patient.fullName}
                        </Link>
                        {" · "}{formatDate(ev.updatedAt)}
                      </p>
                      {appliedTests.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {appliedTests.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/evaluations/${ev.id}`}>Ver Avaliação</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
