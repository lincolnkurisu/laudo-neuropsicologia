import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users, ClipboardList, FileText, TrendingUp,
  ArrowUpRight, ChevronRight, Clock, CheckCircle2, Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, calculateAge } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Busca todas as estatísticas em paralelo
  const [
    totalPatients,
    activeEvaluations,
    completedReports,
    recentPatients,
    recentEvaluations,
  ] = await Promise.all([
    prisma.patient.count({ where: { userId } }),
    prisma.evaluation.count({ where: { userId, status: "IN_PROGRESS" } }),
    prisma.evaluation.count({ where: { userId, status: { in: ["COMPLETED", "REPORT_GENERATED"] } } }),
    prisma.patient.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.evaluation.findMany({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: {
        patient: { select: { fullName: true } },
        testAsrs18: { select: { id: true } },
        testBfp:   { select: { id: true } },
        testBpa2:  { select: { id: true } },
        testWasi:  { select: { id: true } },
        testFdt:   { select: { id: true } },
      },
    }),
  ]);

  const statCards = [
    { label: "Total de Pacientes",  value: totalPatients,     gradient: "stat-gradient-indigo", icon: Users,         trend: null },
    { label: "Avaliações Ativas",   value: activeEvaluations,  gradient: "stat-gradient-emerald", icon: ClipboardList, trend: null },
    { label: "Avaliações Concluídas", value: completedReports, gradient: "stat-gradient-violet", icon: FileText,      trend: null },
    { label: "Total de Avaliações", value: activeEvaluations + completedReports, gradient: "stat-gradient-amber", icon: TrendingUp, trend: null },
  ];

  return (
    <div className="space-y-6">

      {/* Cards de Estatística */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, gradient, icon: Icon, trend }) => (
          <div key={label} className={`${gradient} rounded-2xl p-5 text-white shadow-lg card-hover`}>
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-white/20 p-2.5">
                <Icon className="h-5 w-5" />
              </div>
              {trend && (
                <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                  <ArrowUpRight className="h-3 w-3" />{trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight">{value}</p>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/80">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid principal */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Pacientes recentes */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Pacientes Recentes</h2>
                <p className="text-xs text-muted-foreground">Últimos cadastros</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                <Link href="/patients">
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <CardContent className="p-0">
              {recentPatients.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nenhum paciente cadastrado</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/patients/new">
                      <Plus className="h-3.5 w-3.5 mr-1" />Cadastrar paciente
                    </Link>
                  </Button>
                </div>
              ) : (
                recentPatients.map((patient, idx) => {
                  const lastEval = patient.evaluations[0];
                  const cfg = lastEval ? STATUS_CONFIG[lastEval.status] : null;
                  return (
                    <Link key={patient.id} href={`/patients/${patient.id}`}
                      className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 transition-colors hover:bg-accent/50
                        ${idx !== recentPatients.length - 1 ? "border-b" : ""}`}>
                      <Avatar name={patient.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{patient.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {calculateAge(patient.dateOfBirth)} anos · Cadastrado em {formatDate(patient.createdAt)}
                        </p>
                      </div>
                      {cfg && (
                        <Badge variant={cfg.variant} className="text-[10px] shrink-0">{cfg.label}</Badge>
                      )}
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Avaliações em andamento */}
        <div>
          <Card className="h-full shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Em Andamento</h2>
                <p className="text-xs text-muted-foreground">Avaliações ativas</p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardContent className="p-4 space-y-3">
              {recentEvaluations.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma avaliação ativa</p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/evaluations/new">Nova avaliação</Link>
                  </Button>
                </div>
              ) : (
                recentEvaluations.map((ev) => {
                  const testsDone = [ev.testAsrs18, ev.testBfp, ev.testBpa2, ev.testWasi, ev.testFdt]
                    .filter(Boolean).length;
                  const progress = Math.round((testsDone / 5) * 100);
                  return (
                    <Link key={ev.id} href={`/evaluations/${ev.id}`}
                      className="block rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                      <p className="text-sm font-medium truncate">{ev.patient.fullName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{testsDone}/5 testes</p>
                    </Link>
                  );
                })
              )}
              {recentEvaluations.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="w-full text-xs">
                  <Link href="/evaluations">Ver todas</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
