"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function classifyMfft(errors: number, latency: number): { label: string; color: string } {
  const highErrors = errors > 20;
  const shortLatency = latency < 10;
  if (!highErrors && !shortLatency) return { label: "Reflexivo",     color: "text-green-600" };
  if (highErrors  &&  shortLatency) return { label: "Impulsivo",     color: "text-red-600"   };
  if (!highErrors &&  shortLatency) return { label: "Rápido-Acurado", color: "text-blue-600" };
  return                                   { label: "Lento-Inexato",  color: "text-yellow-600" };
}

function MfftForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [totalErrors, setTotalErrors] = useState("");
  const [meanLatency, setMeanLatency] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const errors = parseInt(totalErrors) || 0;
  const latency = parseFloat(meanLatency) || 0;

  const impulsivityIndex =
    errors > 0 && latency > 0
      ? parseFloat((errors / latency).toFixed(2))
      : null;

  const classification =
    totalErrors !== "" && meanLatency !== "" && latency > 0
      ? classifyMfft(errors, latency)
      : null;

  function errorsColor(n: number) {
    return n <= 20 ? "text-green-600" : "text-red-600";
  }

  function latencyColor(t: number) {
    return t >= 10 ? "text-green-600" : "text-yellow-600";
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalErrors || !meanLatency) {
      setFormError("Preencha todos os campos.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/mfft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalErrors: parseInt(totalErrors),
        meanLatency: parseFloat(meanLatency),
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
        <span>MFFT-BR</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">MFFT-BR — Matching Familiar Figures Test</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Avaliação do estilo cognitivo reflexividade-impulsividade.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total de Erros</p>
          <p className={`text-2xl font-bold ${totalErrors !== "" ? errorsColor(errors) : "text-muted-foreground"}`}>
            {totalErrors !== "" ? errors : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{errors <= 20 ? "dentro do esperado" : "acima do esperado"}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Latência Média (s)</p>
          <p className={`text-2xl font-bold ${meanLatency !== "" && latency > 0 ? latencyColor(latency) : "text-muted-foreground"}`}>
            {meanLatency !== "" && latency > 0 ? `${latency}s` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">segundos</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Estilo Cognitivo</p>
          <p className={`text-lg font-bold leading-tight ${classification?.color ?? "text-muted-foreground"}`}>
            {classification?.label ?? "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {impulsivityIndex !== null ? `índice: ${impulsivityIndex}` : "índice"}
          </p>
        </div>
      </div>

      {/* Matriz explicativa 2x2 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quadrantes do Estilo Cognitivo</CardTitle>
          <CardDescription>Classificação baseada em erros e latência de resposta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="rounded border p-2 bg-blue-50">
              Rápido-Acurado<br />
              <span className="text-muted-foreground">Poucos erros / Rápido</span>
            </div>
            <div className="rounded border p-2 bg-red-50">
              Impulsivo<br />
              <span className="text-muted-foreground">Muitos erros / Rápido</span>
            </div>
            <div className="rounded border p-2 bg-green-50">
              Reflexivo<br />
              <span className="text-muted-foreground">Poucos erros / Lento</span>
            </div>
            <div className="rounded border p-2 bg-yellow-50">
              Lento-Inexato<br />
              <span className="text-muted-foreground">Muitos erros / Lento</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Dados do MFFT-BR</CardTitle>
            <CardDescription>Resultados brutos do teste de figuras familiares</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Latência Média (segundos) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={meanLatency}
                  onChange={(e) => setMeanLatency(e.target.value)}
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
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar MFFT-BR"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function MfftPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <MfftForm />
    </Suspense>
  );
}
