"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

type Domain = {
  key: string;
  label: string;
  max: number;
};

const DOMAINS: Domain[] = [
  { key: "visuospatial", label: "Visuoespacial/Executivo", max: 5 },
  { key: "naming", label: "Nomeação", max: 3 },
  { key: "attention", label: "Atenção", max: 6 },
  { key: "language", label: "Linguagem", max: 3 },
  { key: "abstraction", label: "Abstração", max: 2 },
  { key: "recall", label: "Recordação Tardia", max: 5 },
  { key: "orientation", label: "Orientação", max: 6 },
];

type Scores = {
  visuospatial: number;
  naming: number;
  attention: number;
  language: number;
  abstraction: number;
  recall: number;
  orientation: number;
};

function getClassification(score: number): { label: string; color: string } {
  if (score >= 26) return { label: "Normal", color: "text-green-600" };
  if (score >= 18) return { label: "CCL", color: "text-yellow-600" };
  if (score >= 10) return { label: "Moderado", color: "text-orange-600" };
  return { label: "Grave", color: "text-red-600" };
}

function MocaForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<Scores>({
    visuospatial: 0,
    naming: 0,
    attention: 0,
    language: 0,
    abstraction: 0,
    recall: 0,
    orientation: 0,
  });
  const [educationBonus, setEducationBonus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setField = (key: keyof Scores, val: number) =>
    setScores((prev) => ({ ...prev, [key]: val }));

  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
  const adjustedScore = Math.min(30, totalScore + (educationBonus ? 1 : 0));
  const classification = getClassification(adjustedScore);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/evaluations/${id}/tests/moca`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...scores, educationBonus }),
    });
    if (!res.ok) {
      setError("Erro ao salvar. Tente novamente.");
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
        <span>MoCA</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">MoCA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Montreal Cognitive Assessment — avaliação cognitiva breve multidominial.
        </p>
      </div>

      {/* Live score preview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pontuação Bruta</p>
          <p className="text-2xl font-bold text-indigo-600">
            {totalScore}
            <span className="text-sm text-muted-foreground font-normal">/30</span>
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pontuação Ajustada</p>
          <p className="text-2xl font-bold text-indigo-600">
            {adjustedScore}
            <span className="text-sm text-muted-foreground font-normal">/30</span>
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Classificação</p>
          <p className={`text-xl font-bold ${classification.color}`}>{classification.label}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pontuação por Domínio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DOMAINS.map((domain) => (
              <div key={domain.key} className="flex items-center justify-between gap-4">
                <Label htmlFor={domain.key} className="flex-1 text-sm">
                  {domain.label}
                  <span className="ml-1 text-xs text-muted-foreground">(0–{domain.max})</span>
                </Label>
                <Input
                  id={domain.key}
                  type="number"
                  min={0}
                  max={domain.max}
                  value={scores[domain.key as keyof Scores]}
                  onChange={(e) =>
                    setField(
                      domain.key as keyof Scores,
                      Math.min(domain.max, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-24 text-center"
                  required
                />
              </div>
            ))}

            <div className="pt-2 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={educationBonus}
                  onChange={(e) => setEducationBonus(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-indigo-600"
                />
                <span className="text-sm">Escolaridade ≤ 12 anos (+1 ponto)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar MoCA"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function MocaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MocaForm />
    </Suspense>
  );
}
