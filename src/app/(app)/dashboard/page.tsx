import Link from "next/link";
import { Users, ClipboardList, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Dados mockados para o MVP — substituir por queries Prisma após auth
const mockStats = {
  totalPatients: 12,
  activeEvaluations: 3,
  completedReports: 8,
  thisMonthEvals: 5,
};

const mockRecentPatients = [
  { id: "1", fullName: "Ana Beatriz Silva", age: 34, lastEval: new Date("2026-04-01"), status: "IN_PROGRESS" as const },
  { id: "2", fullName: "Carlos Eduardo Mendes", age: 28, lastEval: new Date("2026-03-28"), status: "COMPLETED" as const },
  { id: "3", fullName: "Fernanda Costa Lima", age: 45, lastEval: new Date("2026-03-20"), status: "REPORT_GENERATED" as const },
];

const STATUS_CONFIG = {
  IN_PROGRESS:       { label: "Em andamento",  variant: "warning"   as const },
  COMPLETED:         { label: "Concluída",      variant: "secondary" as const },
  REPORT_GENERATED:  { label: "Laudo gerado",   variant: "success"   as const },
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao NeuroPsi. Aqui está um resumo da sua atividade clínica.</p>
        </div>
        <Button asChild>
          <Link href="/patients/new">+ Novo Paciente</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">pacientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Ativas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeEvaluations}</div>
            <p className="text-xs text-muted-foreground">em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laudos Gerados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.completedReports}</div>
            <p className="text-xs text-muted-foreground">laudos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.thisMonthEvals}</div>
            <p className="text-xs text-muted-foreground">novas avaliações</p>
          </CardContent>
        </Card>
      </div>

      {/* Pacientes recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Recentes</CardTitle>
          <CardDescription>Últimas avaliações registradas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentPatients.map((patient) => {
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
