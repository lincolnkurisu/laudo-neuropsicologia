"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function hitRateColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-yellow-600";
  return "text-red-600";
}

function CtpForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [hits, setHits]               = useState("");
  const [omissions, setOmissions]     = useState("");
  const [commissions, setCommissions] = useState("");
  const [totalTargets, setTotalTargets] = useState("");
  const [meanHitRT, setMeanHitRT]     = useState("");
  const [hitRTse, setHitRTse]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");

  const total = parseInt(totalTargets) || 0;
  const hitsN  = parseInt(hits)        || 0;
  const omissN = parseInt(omissions)   || 0;
  const commN  = parseInt(commissions) || 0;

  const hitRate       = total > 0 ? (hitsN  / total) * 100 : null;
  const omissionRate  = total > 0 ? (omissN / total) * 100 : null;
  const commissionRate = total > 0 ? (commN  / total) * 100 : null;

  const fmt = (n: number | null) => n !== null ? `${n.toFixed(1)}%` : "—";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hits || !omissions || !commissions || !totalTargets || !meanHitRT || !hitRTse) {
      setFormError("Preencha todos os campos.");
      return;
    }
    if (total <= 0) {
      setFormError("Total de alvos deve ser maior que zero.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/ctp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hits:         parseInt(hits),
        omissions:    parseInt(omissions),
        commissions:  parseInt(commissions),
        totalTargets: parseInt(totalTargets),
        meanHitRT:    parseFloat(meanHitRT),
        hitRTse:      parseFloat(hitRTse),
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
        <span>CTP</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">CTP — Teste de Desempenho Contínuo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insira os resultados brutos obtidos na aplicação do CPT/CTP.
        </p>
      </div>

      {/* Live preview boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Taxa de Acertos</p>
          <p className={`text-2xl font-bold ${hitRate !== null ? hitRateColor(hitRate) : "text-muted-foreground"}`}>
            {fmt(hitRate)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Hit Rate</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">TR Médio</p>
          <p className="text-2xl font-bold text-foreground">
            {meanHitRT !== "" ? `${parseFloat(meanHitRT).toFixed(0)} ms` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Mean RT</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Variabilidade</p>
          <p className="text-2xl font-bold text-foreground">
            {hitRTse !== "" ? `${parseFloat(hitRTse).toFixed(0)} ms` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Hit RT SE</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Card 1: Acertos e Omissões */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Acertos e Omissões</CardTitle>
            <CardDescription>Resultados de detecção de alvos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="totalTargets">Total de Alvos *</Label>
                <Input
                  id="totalTargets"
                  type="number"
                  min={1}
                  value={totalTargets}
                  onChange={(e) => setTotalTargets(e.target.value)}
                  placeholder="Ex.: 360"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hits">Acertos *</Label>
                <Input
                  id="hits"
                  type="number"
                  min={0}
                  value={hits}
                  onChange={(e) => setHits(e.target.value)}
                  placeholder="Ex.: 320"
                  required
                />
                {hitRate !== null && (
                  <p className={`text-[10px] font-medium ${hitRateColor(hitRate)}`}>{fmt(hitRate)}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="omissions">Omissões *</Label>
                <Input
                  id="omissions"
                  type="number"
                  min={0}
                  value={omissions}
                  onChange={(e) => setOmissions(e.target.value)}
                  placeholder="Ex.: 40"
                  required
                />
                {omissionRate !== null && (
                  <p className="text-[10px] text-muted-foreground">{fmt(omissionRate)}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commissions">Comissões *</Label>
                <Input
                  id="commissions"
                  type="number"
                  min={0}
                  value={commissions}
                  onChange={(e) => setCommissions(e.target.value)}
                  placeholder="Ex.: 15"
                  required
                />
                {commissionRate !== null && (
                  <p className="text-[10px] text-muted-foreground">{fmt(commissionRate)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tempo de Reação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tempo de Reação</CardTitle>
            <CardDescription>Latência e variabilidade das respostas corretas (em milissegundos)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="meanHitRT">TR Médio — Hit RT (ms) *</Label>
                <Input
                  id="meanHitRT"
                  type="number"
                  min={0}
                  step="0.01"
                  value={meanHitRT}
                  onChange={(e) => setMeanHitRT(e.target.value)}
                  placeholder="Ex.: 425.5"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hitRTse">Variabilidade — Hit RT SE (ms) *</Label>
                <Input
                  id="hitRTse"
                  type="number"
                  min={0}
                  step="0.01"
                  value={hitRTse}
                  onChange={(e) => setHitRTse(e.target.value)}
                  placeholder="Ex.: 112.3"
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
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
            ) : (
              "Salvar CTP"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CtpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <CtpForm />
    </Suspense>
  );
}
