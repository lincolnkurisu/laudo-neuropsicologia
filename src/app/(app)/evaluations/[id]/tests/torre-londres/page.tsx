"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function TorreLondresForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [totalProblems, setTotalProblems] = useState("");
  const [correctSolutions, setCorrectSolutions] = useState("");
  const [ruleViolations, setRuleViolations] = useState("");
  const [totalMoves, setTotalMoves] = useState("");
  const [meanInitiationTime, setMeanInitiationTime] = useState("");
  const [meanExecutionTime, setMeanExecutionTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const problems = parseInt(totalProblems) || 0;
  const correct = parseInt(correctSolutions) || 0;
  const violations = parseInt(ruleViolations) || 0;
  const initTime = parseFloat(meanInitiationTime) || 0;

  const accuracyPct = problems > 0 ? (correct / problems) * 100 : 0;

  function initiationTimeColor(t: number) {
    if (t <= 5) return "text-green-600";
    if (t <= 10) return "text-yellow-600";
    return "text-red-600";
  }

  function violationsColor(v: number) {
    if (v === 0) return "text-green-600";
    if (v <= 2) return "text-yellow-600";
    return "text-red-600";
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctSolutions) {
      setFormError("Preencha o campo de soluções corretas.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/torre-londres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalProblems: parseInt(totalProblems),
        correctSolutions: parseInt(correctSolutions),
        ruleViolations: parseInt(ruleViolations),
        totalMoves: parseInt(totalMoves),
        meanInitiationTime: parseFloat(meanInitiationTime),
        meanExecutionTime: parseFloat(meanExecutionTime),
        totalTime: parseFloat(totalTime),
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
        <span>Torre de Londres</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">Torre de Londres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre os resultados do teste de planejamento e resolução de problemas.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Soluções Corretas</p>
          <p className={`text-2xl font-bold ${correct > 0 ? "text-green-600" : "text-muted-foreground"}`}>
            {correct > 0 ? `${correct} / ${problems || "?"}` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {problems > 0 && correct > 0 ? `${accuracyPct.toFixed(1)}% acurácia` : "acurácia"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Tempo Médio de Iniciação</p>
          <p className={`text-2xl font-bold ${initTime > 0 ? initiationTimeColor(initTime) : "text-muted-foreground"}`}>
            {initTime > 0 ? `${initTime}s` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">segundos</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Violações de Regra</p>
          <p className={`text-2xl font-bold ${ruleViolations !== "" ? violationsColor(violations) : "text-muted-foreground"}`}>
            {ruleViolations !== "" ? violations : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">infrações</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Acurácia e Resolução</CardTitle>
            <CardDescription>Desempenho na resolução dos problemas da Torre de Londres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Total de Problemas *</Label>
                <Input
                  type="number"
                  min={1}
                  value={totalProblems}
                  onChange={(e) => setTotalProblems(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Soluções Corretas *</Label>
                <Input
                  type="number"
                  min={0}
                  value={correctSolutions}
                  onChange={(e) => setCorrectSolutions(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Violações de Regra *</Label>
                <Input
                  type="number"
                  min={0}
                  value={ruleViolations}
                  onChange={(e) => setRuleViolations(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Total de Movimentos *</Label>
                <Input
                  type="number"
                  min={0}
                  value={totalMoves}
                  onChange={(e) => setTotalMoves(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tempos (segundos)</CardTitle>
            <CardDescription>Tempos de iniciação, execução e total da tarefa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tempo Médio de Iniciação *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={meanInitiationTime}
                  onChange={(e) => setMeanInitiationTime(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tempo Médio de Execução *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={meanExecutionTime}
                  onChange={(e) => setMeanExecutionTime(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Tempo Total *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  placeholder="0.00"
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
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Torre de Londres"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function TorreLondresPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <TorreLondresForm />
    </Suspense>
  );
}
