import Link from "next/link";
import {
  Users, ClipboardList, FileText, TrendingUp,
  ArrowUpRight, ChevronRight, Clock, CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { STATUS_CONFIG, MOCK_STATS, MOCK_RECENT_PATIENTS, MOCK_PATIENTS } from "@/lib/constants";

// ─── Dados das atividades recentes ───────────────────────────────────────────

const RECENT_ACTIVITY = [
  {
    id: "1",
    type: "evaluation" as const,
    text: "Avaliação ASRS-18 aplicada",
    patient: "Ana Beatriz Silva",
    time: "há 2 horas",
  },
  {
    id: "2",
    type: "report" as const,
    text: "Laudo gerado e finalizado",
    patient: "Fernanda Costa Lima",
    time: "hoje às 09:14",
  },
  {
    id: "3",
    type: "patient" as const,
    text: "Novo paciente cadastrado",
    patient: "Carlos Eduardo Mendes",
    time: "ontem às 16:30",
  },
  {
    id: "4",
    type: "evaluation" as const,
    text: "BPA-2 aplicado",
    patient: "Ana Beatriz Silva",
    time: "ontem às 14:00",
  },
];

const ACTIVITY_ICON = {
  evaluation: { Icon: ClipboardList, color: "text-indigo-500",  bg: "bg-indigo-50" },
  report:     { Icon: CheckCircle2,  color: "text-emerald-500", bg: "bg-emerald-50" },
  patient:    { Icon: Users,         color: "text-violet-500",  bg: "bg-violet-50" },
};

// ─── Cards de estatística ─────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    label:    "Total de Pacientes",
    value:    MOCK_STATS.totalPatients,
    sub:      "+2 este mês",
    gradient: "stat-gradient-indigo",
    icon:     Users,
    trend:    "+20%",
  },
  {
    label:    "Avaliações Ativas",
    value:    MOCK_STATS.activeEvaluations,
    sub:      "em andamento agora",
    gradient: "stat-gradient-emerald",
    icon:     ClipboardList,
    trend:    null,
  },
  {
    label:    "Laudos Gerados",
    value:    MOCK_STATS.completedReports,
    sub:      "+3 esta semana",
    gradient: "stat-gradient-violet",
    icon:     FileText,
    trend:    "+15%",
  },
  {
    label:    "Novas Avaliações",
    value:    MOCK_STATS.thisMonthEvals,
    sub:      "este mês",
    gradient: "stat-gradient-amber",
    icon:     TrendingUp,
    trend:    "+8%",
  },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* ── Cards de Estatística ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ label, value, sub, gradient, icon: Icon, trend }) => (
          <div
            key={label}
            className={`${gradient} rounded-2xl p-5 text-white shadow-lg card-hover`}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-white/20 p-2.5">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              {trend && (
                <span className="flex items-center gap-0.5 rounded-full bg-white/20
                                 px-2 py-0.5 text-xs font-semibold">
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  {trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight">{value}</p>
              <p className="mt-0.5 text-sm font-medium text-white/80">{label}</p>
              <p className="mt-1 text-xs text-white/60">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid principal ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Pacientes recentes (col 2) */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Pacientes Recentes</h2>
                <p className="text-xs text-muted-foreground">Últimas avaliações</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                <Link href="/patients">
                  Ver todos <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <CardContent className="p-0">
              {MOCK_RECENT_PATIENTS.map((patient, idx) => {
                const cfg = STATUS_CONFIG[patient.status];
                const fullPatient = MOCK_PATIENTS.find(p => p.id === patient.id);
                return (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors
                               hover:bg-accent/50
                               ${idx !== MOCK_RECENT_PATIENTS.length - 1 ? "border-b" : ""}`}
                  >
                    {/* Avatar */}
                    <Avatar name={patient.fullName} size="md" />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {patient.fullName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {patient.age} anos
                        </span>
                        {fullPatient?.occupation && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {fullPatient.occupation}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status + data */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={cfg.variant} className="text-[10px]">
                        {cfg.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(patient.lastEval)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Atividade recente (col 1) */}
        <div>
          <Card className="h-full shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Atividade</h2>
                <p className="text-xs text-muted-foreground">Últimas ações</p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>

            <CardContent className="p-5 space-y-4">
              {RECENT_ACTIVITY.map((item) => {
                const { Icon, color, bg } = ACTIVITY_ICON[item.type];
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center
                                     rounded-full ${bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {item.text}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.patient}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        {item.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Avaliações em andamento ── */}
      <Card className="shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Avaliações em Andamento</h2>
            <p className="text-xs text-muted-foreground">
              {MOCK_STATS.activeEvaluations} avaliações precisam de atenção
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/evaluations">Ver todas</Link>
          </Button>
        </div>

        <CardContent className="p-0">
          {[
            {
              id: "e1",
              patient: "Ana Beatriz Silva",
              title: "Avaliação Neuropsicológica",
              progress: 40,
              tests: ["ASRS-18", "BPA-2"],
              pending: ["WASI", "FDT", "BFP"],
            },
          ].map((ev) => (
            <div key={ev.id} className="flex items-center gap-4 px-6 py-4">
              <Avatar name={ev.patient} size="md" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{ev.patient}</p>
                    <p className="text-xs text-muted-foreground">{ev.title}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">
                    {ev.progress}%
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r
                               from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${ev.progress}%` }}
                  />
                </div>

                {/* Testes */}
                <div className="flex flex-wrap gap-1.5">
                  {ev.tests.map((t) => (
                    <span key={t}
                      className="inline-flex items-center gap-1 rounded-full
                                 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium
                                 text-emerald-700">
                      <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                      {t}
                    </span>
                  ))}
                  {ev.pending.map((t) => (
                    <span key={t}
                      className="inline-flex items-center gap-1 rounded-full
                                 bg-slate-100 px-2 py-0.5 text-[10px] font-medium
                                 text-slate-500">
                      <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <Button size="sm" asChild className="shrink-0">
                <Link href={`/evaluations/${ev.id}`}>Continuar</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
