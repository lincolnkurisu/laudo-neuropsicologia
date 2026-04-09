import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function EvaluationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const evaluations = await prisma.evaluation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mt-1">
            {evaluations.length === 0
              ? "Nenhuma avaliação iniciada"
              : `${evaluations.length} avaliação${evaluations.length !== 1 ? "ões" : ""}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/evaluations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaliação
          </Link>
        </Button>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium text-foreground">Nenhuma avaliação ainda</p>
            <p className="text-sm mt-1">Clique em &quot;Nova Avaliação&quot; para começar.</p>
            <Button asChild className="mt-5">
              <Link href="/evaluations/new">Criar primeira avaliação</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {evaluations.map((ev) => {
            const cfg = STATUS_CONFIG[ev.status];
            const testsTotal = 5;
            const testsDone = [ev.testAsrs18, ev.testBfp, ev.testBpa2, ev.testWasi, ev.testFdt]
              .filter(Boolean).length;
            const progress = Math.round((testsDone / testsTotal) * 100);

            return (
              <Card key={ev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={ev.patient.fullName} size="md" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{ev.title}</span>
                        <Badge variant={cfg.variant} className="text-[10px] shrink-0">{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        <Link href={`/patients/${ev.patient.id}`} className="text-primary hover:underline font-medium">
                          {ev.patient.fullName}
                        </Link>
                        {" · "}{formatDate(ev.createdAt)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{testsDone}/{testsTotal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                      <Link href={`/evaluations/${ev.id}`}>Abrir</Link>
                    </Button>
                    {(ev.status === "COMPLETED" || ev.status === "REPORT_GENERATED") && (
                      <Button size="sm" asChild className="flex-1 sm:flex-none">
                        <Link href={`/reports/${ev.id}`}>Laudo</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
