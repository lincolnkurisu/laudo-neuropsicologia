"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function WcstForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [totalTrials, setTotalTrials] = useState("");
  const [totalCorrect, setTotalCorrect] = useState("");
  const [totalErrors, setTotalErrors] = useState("");
  const [perseverativeResponses, setPerseverativeResponses] = useState("");
  const [perseverativeErrors, setPerseverativeErrors] = useState("");
  const [nonPerseverativeErrors, setNonPerseverativeErrors] = useState("");
  const [conceptualLevelResponses, setConceptualLevelResponses] = useState("");
  const [categoriesCompleted, setCategoriesCompleted] = useState("");
  const [trialsFirstCategory, setTrialsFirstCategory] = useState("");
  const [failureMaintainSet, setFailureMaintainSet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const trials = parseInt(totalTrials) || 0;
  const persvErrors = parseInt(perseverativeErrors) || 0;
  const conceptual = parseInt(conceptualLevelResponses) || 0;
  const categories = parseInt(categoriesCompleted) || 0;

  const perseverativeErrorsPct = trials > 0 ? (persvErrors / trials) * 100 : 0;
  const conceptualLevelPct = trials > 0 ? (conceptual / trials) * 100 : 0;

  function categoriesColor(n: number) {
    if (n === 6) return "text-blue-600";
    if (n >= 4) return "text-green-600";
    if (n >= 2) return "text-yellow-600";
    return "text-red-600";
  }

  function persvPctColor(pct: number) {
    if (pct <= 10) return "text-green-600";
    if (pct <= 20) return "text-yellow-600";
    return "text-red-600";
  }

  function conceptualPctColor(pct: number) {
    if (pct >= 50) return "text-green-600";
    if (pct >= 30) return "text-yellow-600";
    return "text-red-600";
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalTrials || parseInt(totalTrials) <= 0) {
      setFormError("Total de tentativas deve ser maior que 0.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/wcst`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalTrials: parseInt(totalTrials),
        totalCorrect: parseInt(totalCorrect),
        totalErrors: parseInt(totalErrors),
        perseverativeResponses: parseInt(perseverativeResponses),
        perseverativeErrors: parseInt(perseverativeErrors),
        nonPerseverativeErrors: parseInt(nonPerseverativeErrors),
        conceptualLevelResponses: parseInt(conceptualLevelResponses),
        categoriesCompleted: parseInt(categoriesCompleted),
        trialsFirstCategory: trialsFirstCategory ? parseInt(trialsFirstCategory) : undefined,
        failureMaintainSet: parseInt(failureMaintainSet),
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
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Avaliação</Link>
        <ChevronRight className="h-3 w-3" />
        <span>WCST</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">Wisconsin Card Sorting Test (WCST)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre os resultados do teste de classificação de cartas para avaliação das funções executivas.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Categorias Completadas</p>
          <p className={`text-2xl font-bold ${categories > 0 ? categoriesColor(categories) : "text-muted-foreground"}`}>
            {categories > 0 ? categories : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">0 – 6</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Erros Perseverativos %</p>
          <p className={`text-2xl font-bold ${trials > 0 && persvErrors > 0 ? persvPctColor(perseverativeErrorsPct) : "text-muted-foreground"}`}>
            {trials > 0 && persvErrors > 0 ? `${perseverativeErrorsPct.toFixed(1)}%` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">de {trials || "?"} tentativas</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Nível Conceitual %</p>
          <p className={`text-2xl font-bold ${trials > 0 && conceptual > 0 ? conceptualPctColor(conceptualLevelPct) : "text-muted-foreground"}`}>
            {trials > 0 && conceptual > 0 ? `${conceptualLevelPct.toFixed(1)}%` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">de {trials || "?"} tentativas</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Desempenho Geral</CardTitle>
            <CardDescription>Métricas globais de desempenho no WCST</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Total de Tentativas * <span className="text-muted-foreground">(máx. 128)</span></Label>
                <Input
                  type="number"
                  min={1}
                  max={128}
                  value={totalTrials}
                  onChange={(e) => setTotalTrials(e.target.value)}
                  placeholder="128"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Respostas Corretas *</Label>
                <Input
                  type="number"
                  min={0}
                  value={totalCorrect}
                  onChange={(e) => setTotalCorrect(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Total de Erros *</Label>
                <Input
                  type="number"
                  min={0}
                  value={totalErrors}
                  onChange={(e) => setTotalErrors(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categorias Completadas * <span className="text-muted-foreground">(máx. 6)</span></Label>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={categoriesCompleted}
                  onChange={(e) => setCategoriesCompleted(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tentativas até 1ª Categoria <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={trialsFirstCategory}
                  onChange={(e) => setTrialsFirstCategory(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Falhas em Manter o Set *</Label>
                <Input
                  type="number"
                  min={0}
                  value={failureMaintainSet}
                  onChange={(e) => setFailureMaintainSet(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Erros Perseverativos e Conceitual</CardTitle>
            <CardDescription>Detalhamento dos tipos de erros e respostas conceituais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Respostas Perseverativas *</Label>
                <Input
                  type="number"
                  min={0}
                  value={perseverativeResponses}
                  onChange={(e) => setPerseverativeResponses(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Erros Perseverativos *</Label>
                <Input
                  type="number"
                  min={0}
                  value={perseverativeErrors}
                  onChange={(e) => setPerseverativeErrors(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Erros Não-Perseverativos *</Label>
                <Input
                  type="number"
                  min={0}
                  value={nonPerseverativeErrors}
                  onChange={(e) => setNonPerseverativeErrors(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Respostas de Nível Conceitual *</Label>
                <Input
                  type="number"
                  min={0}
                  value={conceptualLevelResponses}
                  onChange={(e) => setConceptualLevelResponses(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar WCST"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function WcstPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <WcstForm />
    </Suspense>
  );
}
