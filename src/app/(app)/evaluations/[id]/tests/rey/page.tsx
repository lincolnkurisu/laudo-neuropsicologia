"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function classifyRey(score: number) {
  if (score >= 32) return { label: "Superior",       color: "text-blue-600" };
  if (score >= 24) return { label: "Médio-Superior", color: "text-green-600" };
  if (score >= 17) return { label: "Médio",          color: "text-green-600" };
  if (score >= 11) return { label: "Médio-Inferior", color: "text-yellow-600" };
  return               { label: "Rebaixado",         color: "text-red-600" };
}

function ReyForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [copyScore,   setCopyScore]   = useState("");
  const [copyTime,    setCopyTime]    = useState("");
  const [recallScore, setRecallScore] = useState("");
  const [recallTime,  setRecallTime]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const copy   = parseFloat(copyScore)   || 0;
  const recall = parseFloat(recallScore) || 0;
  const savings = copy > 0 ? Math.round((recall / copy) * 100 * 10) / 10 : 0;
  const copyClass   = copy   > 0 ? classifyRey(copy)   : null;
  const recallClass = recall > 0 ? classifyRey(recall) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyScore || !recallScore) { setFormError("Preencha os escores de cópia e recordação."); return; }
    setSubmitting(true); setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/rey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        copyScore:   parseFloat(copyScore),
        copyTime:    copyTime   ? parseFloat(copyTime)   : null,
        recallScore: parseFloat(recallScore),
        recallTime:  recallTime ? parseFloat(recallTime) : null,
      }),
    });
    if (!res.ok) { setFormError("Erro ao salvar. Tente novamente."); setSubmitting(false); return; }
    router.push(`/evaluations/${id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Avaliação</Link>
        <ChevronRight className="h-3 w-3" />
        <span>Figura de Rey</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">Figura Complexa de Rey</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Avaliação da memória visuoespacial e habilidades de construção. Escore máximo: 36 pontos.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Cópia</p>
          <p className={`text-2xl font-bold ${copyClass?.color ?? "text-muted-foreground"}`}>
            {copy > 0 ? copy : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{copyClass?.label ?? ""}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Recordação</p>
          <p className={`text-2xl font-bold ${recallClass?.color ?? "text-muted-foreground"}`}>
            {recall > 0 ? recall : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{recallClass?.label ?? ""}</p>
        </div>
        <div className="rounded-lg border p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Retenção</p>
          <p className="text-2xl font-bold text-indigo-600">{savings > 0 ? `${savings}%` : "—"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Recordação / Cópia</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Cópia</CardTitle>
            <CardDescription>Reprodução imediata da figura (0–36 pontos)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Escore (0–36) *</Label>
                <Input type="number" min={0} max={36} step={0.5}
                  value={copyScore} onChange={(e) => setCopyScore(e.target.value)}
                  placeholder="Ex: 30" required />
              </div>
              <div className="space-y-1.5">
                <Label>Tempo (segundos)</Label>
                <Input type="number" min={0} step={1}
                  value={copyTime} onChange={(e) => setCopyTime(e.target.value)}
                  placeholder="Opcional" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recordação (20–30 min)</CardTitle>
            <CardDescription>Reprodução após intervalo de tempo (0–36 pontos)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Escore (0–36) *</Label>
                <Input type="number" min={0} max={36} step={0.5}
                  value={recallScore} onChange={(e) => setRecallScore(e.target.value)}
                  placeholder="Ex: 22" required />
              </div>
              <div className="space-y-1.5">
                <Label>Tempo (segundos)</Label>
                <Input type="number" min={0} step={1}
                  value={recallTime} onChange={(e) => setRecallTime(e.target.value)}
                  placeholder="Opcional" />
              </div>
            </div>
          </CardContent>
        </Card>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Figura de Rey"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ReyPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}><ReyForm /></Suspense>;
}
