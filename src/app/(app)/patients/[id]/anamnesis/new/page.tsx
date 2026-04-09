"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  id, label, optional = true, multiline = true,
  value, onChange, placeholder,
}: {
  id: string; label: string; optional?: boolean; multiline?: boolean;
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{!optional && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Digite aqui..."}
          rows={3}
          className="resize-none"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function NewAnamnesisForm() {
  const router = useRouter();
  const { id: patientId } = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [fields, setFields] = useState({
    mainComplaint:           "",
    complaintDuration:       "",
    referralSource:          "",
    medicalHistory:          "",
    currentMedications:      "",
    previousTreatments:      "",
    familyHistory:           "",
    birthConditions:         "",
    developmentalMilestones: "",
    schoolHistory:           "",
    learningDifficulties:    "",
    livingSituation:         "",
    socialSupport:           "",
    recentLifeEvents:        "",
    sleepQuality:            "",
    physicalActivity:        "",
    substanceUse:            "",
    clinicalObservations:    "",
    behaviorDuringSession:   "",
  });

  const set = (key: keyof typeof fields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.mainComplaint.trim()) {
      setError("A queixa principal é obrigatória.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, v.trim() || null])
    );

    const res = await fetch(`/api/patients/${patientId}/anamnesis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError("Erro ao salvar anamnese. Tente novamente.");
      setSubmitting(false);
      return;
    }

    router.push(`/patients/${patientId}?tab=anamneses`);
  };

  return (
    <div className="max-w-3xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/patients" className="hover:text-primary">Pacientes</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/patients/${patientId}`} className="hover:text-primary">Perfil</Link>
        <ChevronRight className="h-3 w-3" />
        <span>Nova Anamnese</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Anamnese</h1>
        <p className="text-muted-foreground mt-1">
          Preencha as informações clínicas do paciente. Apenas a queixa principal é obrigatória.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">

        <Section title="Queixa Principal">
          <Field id="mainComplaint" label="Queixa principal" optional={false}
            value={fields.mainComplaint} onChange={set("mainComplaint")}
            placeholder="Descreva o motivo da consulta..." />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="complaintDuration" label="Duração da queixa" multiline={false}
              value={fields.complaintDuration} onChange={set("complaintDuration")}
              placeholder="Ex: 6 meses" />
            <Field id="referralSource" label="Fonte de encaminhamento" multiline={false}
              value={fields.referralSource} onChange={set("referralSource")}
              placeholder="Ex: Médico, escola, espontâneo..." />
          </div>
        </Section>

        <Section title="Histórico de Saúde">
          <Field id="medicalHistory" label="Histórico médico"
            value={fields.medicalHistory} onChange={set("medicalHistory")}
            placeholder="Doenças, cirurgias, hospitalizações..." />
          <Field id="currentMedications" label="Medicações em uso"
            value={fields.currentMedications} onChange={set("currentMedications")}
            placeholder="Nome do medicamento e dose..." />
          <Field id="previousTreatments" label="Tratamentos anteriores"
            value={fields.previousTreatments} onChange={set("previousTreatments")}
            placeholder="Psicoterapia, fonoaudiologia, psiquiatria..." />
          <Field id="familyHistory" label="Histórico familiar"
            value={fields.familyHistory} onChange={set("familyHistory")}
            placeholder="Doenças mentais, neurológicas ou outros na família..." />
        </Section>

        <Section title="Desenvolvimento e Escolaridade">
          <Field id="birthConditions" label="Condições de nascimento"
            value={fields.birthConditions} onChange={set("birthConditions")}
            placeholder="Parto normal/cesárea, intercorrências, peso ao nascer..." />
          <Field id="developmentalMilestones" label="Marcos do desenvolvimento"
            value={fields.developmentalMilestones} onChange={set("developmentalMilestones")}
            placeholder="Fala, marcha, controle esfincteriano..." />
          <Field id="schoolHistory" label="Histórico escolar"
            value={fields.schoolHistory} onChange={set("schoolHistory")}
            placeholder="Desempenho, reprovações, relacionamento com colegas..." />
          <Field id="learningDifficulties" label="Dificuldades de aprendizagem"
            value={fields.learningDifficulties} onChange={set("learningDifficulties")}
            placeholder="Leitura, escrita, matemática, atenção..." />
        </Section>

        <Section title="Contexto Social e de Vida">
          <Field id="livingSituation" label="Situação de moradia"
            value={fields.livingSituation} onChange={set("livingSituation")}
            placeholder="Com quem mora, tipo de residência..." />
          <Field id="socialSupport" label="Suporte social"
            value={fields.socialSupport} onChange={set("socialSupport")}
            placeholder="Família, amigos, rede de apoio..." />
          <Field id="recentLifeEvents" label="Eventos de vida recentes"
            value={fields.recentLifeEvents} onChange={set("recentLifeEvents")}
            placeholder="Perdas, mudanças, separações, traumas..." />
        </Section>

        <Section title="Hábitos e Estilo de Vida">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field id="sleepQuality" label="Qualidade do sono" multiline={false}
              value={fields.sleepQuality} onChange={set("sleepQuality")}
              placeholder="Ex: Boa, insônia..." />
            <Field id="physicalActivity" label="Atividade física" multiline={false}
              value={fields.physicalActivity} onChange={set("physicalActivity")}
              placeholder="Ex: Caminhada 3x/sem..." />
            <Field id="substanceUse" label="Uso de substâncias" multiline={false}
              value={fields.substanceUse} onChange={set("substanceUse")}
              placeholder="Ex: Nega, álcool social..." />
          </div>
        </Section>

        <Section title="Observações Clínicas">
          <Field id="clinicalObservations" label="Observações clínicas"
            value={fields.clinicalObservations} onChange={set("clinicalObservations")}
            placeholder="Impressões gerais do avaliador..." />
          <Field id="behaviorDuringSession" label="Comportamento durante a sessão"
            value={fields.behaviorDuringSession} onChange={set("behaviorDuringSession")}
            placeholder="Cooperação, atenção, humor, aparência..." />
        </Section>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <div className="flex gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
              : "Salvar Anamnese"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewAnamnesisPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewAnamnesisForm />
    </Suspense>
  );
}
