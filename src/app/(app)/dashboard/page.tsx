import Link from "next/link";
import { Users, ClipboardList, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { STATUS_CONFIG, MOCK_STATS, MOCK_RECENT_PATIENTS } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao NeuroPsi. Aqui está um resumo da sua atividade clínica.
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">+ Novo Paciente</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total de Pacientes",   value: MOCK_STATS.totalPatients,    sub: "pacientes cadastrados", Icon: Users },
          { title: "Avaliações Ativas",    value: MOCK_STATS.activeEvaluations, sub: "em andamento",         Icon: ClipboardList },
          { title: "Laudos Gerados",       value: MOCK_STATS.completedReports, sub: "laudos finalizados",    Icon: FileText },
          { title: "Este Mês",             value: MOCK_STATS.thisMonthEvals,   sub: "novas avaliações",      Icon: TrendingUp },
        ].map(({ title, value, sub, Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pacientes recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Recentes</CardTitle>
          <CardDescription>Últimas avaliações registradas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_RECENT_PATIENTS.map((patient) => {
              const statusCfg = STATUS_CONFIG[patient.status];
              return (
                <div
                  key={patient.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.age} anos · Última avaliação em {formatDate(patient.lastEval)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/patients/${patient.id}`}>Ver perfil</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Button variant="ghost" asChild className="w-full">
              <Link href="/patients">Ver todos os pacientes →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
