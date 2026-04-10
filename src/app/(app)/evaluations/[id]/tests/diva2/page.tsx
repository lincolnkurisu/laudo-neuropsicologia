"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

const IA_CRITERIA = [
  "Não presta atenção em detalhes ou comete erros por descuido",
  "Dificuldade em manter atenção em tarefas ou atividades lúdicas",
  "Parece não escutar quando lhe dirigem a palavra diretamente",
  "Não segue instruções até o fim / não conclui tarefas",
  "Dificuldade para organizar tarefas e atividades",
  "Evita tarefas que exijam esforço mental prolongado",
  "Perde coisas necessárias para tarefas ou atividades",
  "É facilmente distraído por estímulos externos",
  "É esquecido em atividades diárias",
];

const HI_CRITERIA = [
  "Remexe mãos/pés ou se contorce na cadeira",
  "Levanta-se em situações em que se espera que permaneça sentado",
  "Corre ou escala em situações inadequadas (adulto: sensação de inquietude)",
  "Não consegue jogar/participar de atividades de lazer silenciosamente",
  "Age como se estivesse 'a todo vapor' ou 'motorizado'",
  "Fala em excesso",
  "Dá respostas precipitadas antes de a pergunta ser concluída",
  "Tem dificuldade de aguardar sua vez",
  "Interrompe ou se intromete em conversas/jogos de outros",
];

interface ChecklistSectionProps {
  title: string;
  description: string;
  criteria: string[];
  values: boolean[];
  onChange: (index: number, checked: boolean) => void;
}

function ChecklistSection({ title, description, criteria, values, onChange }: ChecklistSectionProps) {
  const count = values.filter(Boolean).length;
  const meetsCriteria = count >= 5;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meetsCriteria ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
            {count} / 9 critérios
          </span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {criteria.map((criterion, i) => (
            <label
              key={i}
              className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded"
                checked={values[i]}
                onChange={(e) => onChange(i, e.target.checked)}
              />
              <span className="text-sm">{criterion}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Diva2Form() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [iaAdult, setIaAdult] = useState<boolean[]>(Array(9).fill(false));
  const [iaChild, setIaChild] = useState<boolean[]>(Array(9).fill(false));
  const [hiAdult, setHiAdult] = useState<boolean[]>(Array(9).fill(false));
  const [hiChild, setHiChild] = useState<boolean[]>(Array(9).fill(false));
  const [age, setAge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const toggle = (
    arr: boolean[],
    setter: React.Dispatch<React.SetStateAction<boolean[]>>,
    index: number,
    checked: boolean,
  ) => {
    const next = [...arr];
    next[index] = checked;
    setter(next);
  };

  const iaAdultCount = iaAdult.filter(Boolean).length;
  const iaChildCount = iaChild.filter(Boolean).length;
  const hiAdultCount = hiAdult.filter(Boolean).length;
  const hiChildCount = hiChild.filter(Boolean).length;

  const meetsIaAdult = iaAdultCount >= 5;
  const meetsIaChild = iaChildCount >= 5;
  const meetsHiAdult = hiAdultCount >= 5;
  const meetsHiChild = hiChildCount >= 5;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/diva2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        iaAdult,
        iaChild,
        hiAdult,
        hiChild,
        age: parseInt(age) || 30,
      }),
    });
    if (!res.ok) {
      setFormError("Erro ao salvar. Tente novamente.");
      setSubmitting(false);
      return;
    }
    router.push(`/evaluations/${id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Avaliação</Link>
        <ChevronRight className="h-3 w-3" />
        <span>DIVA 2.0</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">DIVA 2.0</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Entrevista Diagnóstica para TDAH em Adultos — critérios DSM-5.
        </p>
      </div>

      {/* Live summary panel */}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumo dos critérios</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Desatenção (adulto)", count: iaAdultCount, meets: meetsIaAdult, threshold: "≥5" },
            { label: "Desatenção (infância)", count: iaChildCount, meets: meetsIaChild, threshold: "≥5" },
            { label: "Hiperatv./Impuls. (adulto)", count: hiAdultCount, meets: meetsHiAdult, threshold: "≥5" },
            { label: "Hiperatv./Impuls. (infância)", count: hiChildCount, meets: meetsHiChild, threshold: "≥5" },
          ].map(({ label, count, meets, threshold }) => (
            <div key={label} className="rounded-md border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground leading-tight mb-1">{label}</p>
              <p className={`text-xl font-bold ${meets ? "text-red-600" : "text-muted-foreground"}`}>{count}/9</p>
              <p className={`text-[10px] mt-0.5 font-medium ${meets ? "text-red-600" : "text-muted-foreground"}`}>
                {meets ? `Critério atingido (${threshold})` : `Critério não atingido (${threshold})`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Age input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Dados do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-w-[10rem]">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex.: 32"
                required
              />
            </div>
          </CardContent>
        </Card>

        <ChecklistSection
          title="Desatenção — Idade Adulta (atual)"
          description="Marque os critérios presentes atualmente (≥5 para adultos)"
          criteria={IA_CRITERIA}
          values={iaAdult}
          onChange={(i, v) => toggle(iaAdult, setIaAdult, i, v)}
        />

        <ChecklistSection
          title="Desatenção — Infância (antes dos 12 anos)"
          description="Marque os critérios presentes antes dos 12 anos (≥5)"
          criteria={IA_CRITERIA}
          values={iaChild}
          onChange={(i, v) => toggle(iaChild, setIaChild, i, v)}
        />

        <ChecklistSection
          title="Hiperatividade/Impulsividade — Idade Adulta (atual)"
          description="Marque os critérios presentes atualmente (≥5 para adultos)"
          criteria={HI_CRITERIA}
          values={hiAdult}
          onChange={(i, v) => toggle(hiAdult, setHiAdult, i, v)}
        />

        <ChecklistSection
          title="Hiperatividade/Impulsividade — Infância (antes dos 12 anos)"
          description="Marque os critérios presentes antes dos 12 anos (≥5)"
          criteria={HI_CRITERIA}
          values={hiChild}
          onChange={(i, v) => toggle(hiChild, setHiChild, i, v)}
        />

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
            ) : (
              "Salvar DIVA 2.0"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Diva2Page() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <Diva2Form />
    </Suspense>
  );
}
