import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TEST_LABELS: Record<string, string> = {
  testWasi: "WASI", testMoca: "MoCA", testRavlt: "RAVLT", testRey: "Rey",
  testBpa2: "BPA-2", testFdt: "FDT", testTmt: "TMT", testCtp: "CTP",
  testWcst: "WCST", testTorreLondres: "Torre", testFluencia: "Fluência",
  testBdi2: "BDI-II", testBai: "BAI", testAsrs18: "ASRS-18",
  testDiva2: "DIVA 2.0", testCaars: "CAARS", testMfft: "MFFT",
  testBfp: "BFP", testFauxPas: "Faux Pas",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch all evaluations — with fallback if new test tables don't exist yet
  const evaluations = await prisma.evaluation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      patient: { select: { id: true, fullName: true } },
      testWasi:        { select: { id: true } },
      testMoca:        { select: { id: true } },
      testRavlt:       { select: { id: true } },
      testRey:         { select: { id: true } },
      testBpa2:        { select: { id: true } },
      testFdt:         { select: { id: true } },
      testTmt:         { select: { id: true } },
      testCtp:         { select: { id: true } },
      testWcst:        { select: { id: true } },
      testTorreLondres:{ select: { id: true } },
      testFluencia:    { select: { id: true } },
      testBdi2:        { select: { id: true } },
      testBai:         { select: { id: true } },
      testAsrs18:      { select: { id: true } },
      testDiva2:       { select: { id: true } },
      testCaars:       { select: { id: true } },
      testMfft:        { select: { id: true } },
      testBfp:         { select: { id: true } },
      testFauxPas:     { select: { id: true } },
    },
  }).catch(() =>
    prisma.evaluation.findMany({
      where: { userId: session!.user!.id },
      orderBy: { updatedAt: "desc" },
      include: {
        patient: { select: { id: true, fullName: true } },
        testWasi:     { select: { id: true } },
        testMoca:     { select: { id: true } },
        testRavlt:    { select: { id: true } },
        testRey:      { select: { id: true } },
        testBpa2:     { select: { id: true } },
        testFdt:      { select: { id: true } },
        testTmt:      { select: { id: true } },
        testBdi2:     { select: { id: true } },
        testBai:      { select: { id: true } },
        testAsrs18:   { select: { id: true } },
        testFluencia: { select: { id: true } },
        testBfp:      { select: { id: true } },
      },
    })
  );

  // Only show evaluations that have at least one test applied
  const withTests = evaluations.filter((ev) =>
    Object.keys(TEST_LABELS).some((key) => (ev as Record<string, unknown>)[key] !== null && (ev as Record<string, unknown>)[key] !== undefined)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mt-1">
          {withTests.length === 0
            ? "Nenhum laudo disponível ainda"
            : `${withTests.length} avaliação${withTests.length !== 1 ? "ões" : ""} com testes aplicados`}
        </p>
      </div>

      {withTests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium text-foreground">Nenhum laudo disponível</p>
            <p className="text-sm mt-1">
              Aplique pelo menos um teste em uma avaliação para gerar o laudo.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/evaluations">Ver avaliações</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {withTests.map((ev) => {
            const appliedTests = Object.entries(TEST_LABELS)
              .filter(([key]) => (ev as Record<string, unknown>)[key] !== null && (ev as Record<string, unknown>)[key] !== undefined)
              .map(([, label]) => label);

            return (
              <Card key={ev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={ev.patient.fullName} size="md" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{ev.title}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {appliedTests.length} teste{appliedTests.length !== 1 ? "s" : ""}
                        </Badge>
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
                          {appliedTests.slice(0, 8).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                          {appliedTests.length > 8 && (
                            <Badge variant="outline" className="text-[10px]">+{appliedTests.length - 8}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/reports/${ev.id}`}>
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        Ver Laudo
                      </Link>
                    </Button>
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
