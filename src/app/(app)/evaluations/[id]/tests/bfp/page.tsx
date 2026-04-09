"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

const DIMENSIONS = [
  {
    key: "neuroticismo",
    label: "Neuroticismo (N)",
    desc: "Instabilidade emocional, ansiedade, vulnerabilidade ao estresse.",
    max: 120,
    normMean: 55, normSD: 22,
  },
  {
    key: "extroversao",
    label: "Extroversão (E)",
    desc: "Sociabilidade, assertividade, busca de sensações.",
    max: 84,
    normMean: 57, normSD: 15,
  },
  {
    key: "socializacao",
    label: "Socialização (S)",
    desc: "Amabilidade, altruísmo, confiança nos outros.",
    max: 84,
    normMean: 62, normSD: 13,
  },
  {
    key: "realizacao",
    label: "Realização (R)",
    desc: "Conscienciosidade, organização, autodisciplina.",
    max: 80,
    normMean: 55, normSD: 14,
  },
  {
    key: "abertura",
    label: "Abertura (A)",
    desc: "Abertura à experiência, curiosidade intelectual, criatividade.",
    max: 56,
    normMean: 38, normSD: 9,
  },
] as const;

type DimKey = typeof DIMENSIONS[number]["key"];

/** Approximate Normal CDF using Abramowitz & Stegun formula */
function normCDF(z: number) {
  if (z < -4) return 0;
  if (z > 4) return 1;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const val = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;
  return z >= 0 ? val : 1 - val;
}

function toPercentile(raw: number, mean: number, sd: number) {
  const z = (raw - mean) / sd;
  return Math.round(normCDF(z) * 100);
}

function classifyPercentile(p: number) {
  if (p >= 76) return { label: "Alto",        color: "text-blue-600" };
  if (p >= 26) return { label: "Médio",       color: "text-green-600" };
  if (p >= 11) return { label: "Médio-Baixo", color: "text-yellow-600" };
  return             { label: "Baixo",        color: "text-red-600" };
}

function BfpForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [fields, setFields] = useState<Record<DimKey, string>>({
    neuroticismo: "", extroversao: "", socializacao: "", realizacao: "", abertura: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (k: DimKey, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (DIMENSIONS.some((d) => !fields[d.key])) {
      setFormError("Preencha todas as dimensões."); return;
    }
    setSubmitting(true); setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/bfp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        neuroticismoRaw:  Number(fields.neuroticismo),
        extroversaoRaw:   Number(fields.extroversao),
        socializacaoRaw:  Number(fields.socializacao),
        realizacaoRaw:    Number(fields.realizacao),
        aberturaRaw:      Number(fields.abertura),
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
        <span>BFP</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">BFP — Bateria Fatorial de Personalidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insira o escore bruto de cada dimensão conforme o protocolo de correção do BFP.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DIMENSIONS.map(({ key, label, normMean, normSD }) => {
          const raw = Number(fields[key]);
          const p = raw > 0 ? toPercentile(raw, normMean, normSD) : null;
          const cls = p !== null ? classifyPercentile(p) : null;
          return (
            <div key={key} className="rounded-lg border p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{label}</p>
              <p className={`text-xl font-bold ${cls?.color ?? "text-muted-foreground"}`}>
                {p !== null ? `P${p}` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{cls?.label ?? ""}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {DIMENSIONS.map(({ key, label, desc, max }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{label}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-w-xs">
                <Label>Escore bruto (0–{max}) *</Label>
                <Input
                  type="number" min={0} max={max}
                  value={fields[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={`0 a ${max}`}
                  required
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar BFP"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function BfpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <BfpForm />
    </Suspense>
  );
}
