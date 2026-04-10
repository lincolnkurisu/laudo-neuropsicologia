import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string; anamnesisId: string }>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </dt>
      <dd className="text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">{children}</dl>
      </CardContent>
    </Card>
  );
}

export default async function AnamnesisDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: patientId, anamnesisId } = await params;

  const anamnesis = await prisma.anamnesis.findFirst({
    where: {
      id: anamnesisId,
      patientId,
      patient: { userId: session.user.id },
    },
    include: {
      patient: { select: { fullName: true } },
    },
  });

  if (!anamnesis) notFound();

  return (
    <div className="max-w-3xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <Link href="/patients" className="hover:text-primary">Pacientes</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/patients/${patientId}`} className="hover:text-primary truncate max-w-[120px] sm:max-w-none">
          {anamnesis.patient.fullName}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/patients/${patientId}?tab=anamneses`} className="hover:text-primary">
          Anamneses
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span>Detalhe</span>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Anamnese</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registrada em {formatDate(anamnesis.createdAt)} · {anamnesis.patient.fullName}
          </p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto shrink-0">
          <Link href={`/patients/${patientId}?tab=anamneses`}>Voltar</Link>
        </Button>
      </div>

      {/* Queixa Principal */}
      <Section title="Queixa Principal">
        <Field label="Queixa principal" value={anamnesis.mainComplaint} />
        <Field label="Duração / início dos sintomas" value={anamnesis.complaintDuration} />
        <Field label="Fonte de encaminhamento" value={anamnesis.referralSource} />
      </Section>

      {/* Histórico de Saúde */}
      {(anamnesis.medicalHistory || anamnesis.currentMedications || anamnesis.previousTreatments || anamnesis.familyHistory) && (
        <Section title="Histórico de Saúde">
          <Field label="Histórico médico / diagnósticos anteriores" value={anamnesis.medicalHistory} />
          <Field label="Medicamentos em uso" value={anamnesis.currentMedications} />
          <Field label="Tratamentos anteriores" value={anamnesis.previousTreatments} />
          <Field label="Histórico familiar relevante" value={anamnesis.familyHistory} />
        </Section>
      )}

      {/* Desenvolvimento e Escolaridade */}
      {(anamnesis.birthConditions || anamnesis.developmentalMilestones || anamnesis.schoolHistory || anamnesis.learningDifficulties) && (
        <Section title="Desenvolvimento e Escolaridade">
          <Field label="Condições de nascimento / gestação" value={anamnesis.birthConditions} />
          <Field label="Marcos do desenvolvimento" value={anamnesis.developmentalMilestones} />
          <Field label="Histórico escolar" value={anamnesis.schoolHistory} />
          <Field label="Dificuldades de aprendizagem" value={anamnesis.learningDifficulties} />
        </Section>
      )}

      {/* Contexto Social */}
      {(anamnesis.livingSituation || anamnesis.socialSupport || anamnesis.recentLifeEvents) && (
        <Section title="Contexto Social e Familiar">
          <Field label="Situação de moradia / composição familiar" value={anamnesis.livingSituation} />
          <Field label="Suporte social" value={anamnesis.socialSupport} />
          <Field label="Eventos de vida recentes" value={anamnesis.recentLifeEvents} />
        </Section>
      )}

      {/* Hábitos */}
      {(anamnesis.sleepQuality || anamnesis.physicalActivity || anamnesis.substanceUse) && (
        <Section title="Hábitos e Estilo de Vida">
          <Field label="Qualidade do sono" value={anamnesis.sleepQuality} />
          <Field label="Atividade física" value={anamnesis.physicalActivity} />
          <Field label="Uso de substâncias" value={anamnesis.substanceUse} />
        </Section>
      )}

      {/* Observações Clínicas */}
      {(anamnesis.clinicalObservations || anamnesis.behaviorDuringSession) && (
        <Section title="Observações Clínicas">
          <Field label="Observações clínicas" value={anamnesis.clinicalObservations} />
          <Field label="Comportamento durante a sessão" value={anamnesis.behaviorDuringSession} />
        </Section>
      )}

      <div className="flex justify-end pb-6">
        <Button variant="outline" asChild>
          <Link href={`/patients/${patientId}?tab=anamneses`}>Voltar ao Paciente</Link>
        </Button>
      </div>
    </div>
  );
}
