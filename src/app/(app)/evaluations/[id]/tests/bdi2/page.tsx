"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight } from "lucide-react";

const ITEMS = [
  "Tristeza",
  "Pessimismo",
  "Fracassos passados",
  "Perda de prazer",
  "Sentimentos de culpa",
  "Sentimentos de punição",
  "Autodepreciação",
  "Autocrítica",
  "Pensamentos suicidas",
  "Choro",
  "Agitação",
  "Perda de interesse",
  "Indecisão",
  "Desvalorização",
  "Perda de energia",
  "Mudanças no padrão de sono",
  "Irritabilidade",
  "Mudanças no apetite",
  "Dificuldade de concentração",
  "Cansaço/fadiga",
  "Perda de interesse sexual",
];

const LIKERT = ["0 – Ausente", "1 – Leve", "2 – Moderado", "3 – Grave"];

function getClassification(score: number): { label: string; color: string } {
  if (score <= 13) return { label: "Mínimo", color: "text-green-600" };
  if (score <= 19) return { label: "Leve", color: "text-yellow-600" };
  if (score <= 28) return { label: "Moderado", color: "text-orange-600" };
  return { label: "Grave", color: "text-red-600" };
}

function ItemRow({
  index,
  label,
  value,
  onChange,
}: {
  index: number;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-sm font-medium">
        {index}. {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {LIKERT.map((lbl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`rounded-md border text-xs px-2 py-1 font-medium transition-colors
              ${
                value === i
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-border bg-background hover:bg-accent"
              }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bdi2Form() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<number[]>(Array(21).fill(0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (idx: number, val: number) =>
    setItems((prev) => {
      const n = [...prev];
      n[idx] = val;
      return n;
    });

  const totalScore = items.reduce((s, v) => s + v, 0);
  const classification = getClassification(totalScore);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/evaluations/${id}/tests/bdi2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
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
        <span>BDI-II</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">BDI-II</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inventário de Depressão de Beck — 21 itens. Selecione a intensidade de cada sintoma.
        </p>
      </div>

      {/* Live score preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pontuação Total</p>
          <p className="text-2xl font-bold text-indigo-600">
            {totalScore}
            <span className="text-sm text-muted-foreground font-normal">/63</span>
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
            <CardTitle className="text-base flex items-center gap-2">
              Itens BDI-II
              <Badge variant="outline" className="text-[10px]">21 itens</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ITEMS.map((label, i) => (
              <ItemRow
                key={i}
                index={i + 1}
                label={label}
                value={items[i]}
                onChange={(v) => set(i, v)}
              />
            ))}
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
              "Salvar BDI-II"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Bdi2Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Bdi2Form />
    </Suspense>
  );
}
