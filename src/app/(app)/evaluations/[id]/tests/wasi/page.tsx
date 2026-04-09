"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function classifyQI(qi: number) {
  if (qi >= 130) return { label: "Muito Superior",     color: "text-violet-600" };
  if (qi >= 120) return { label: "Superior",           color: "text-indigo-600" };
  if (qi >= 110) return { label: "Médio-Superior",     color: "text-blue-600" };
  if (qi >= 90)  return { label: "Médio",              color: "text-green-600" };
  if (qi >= 80)  return { label: "Médio-Inferior",     color: "text-yellow-600" };
  if (qi >= 70)  return { label: "Limítrofe",          color: "text-orange-600" };
  return              { label: "Def. Intelectual",     color: "text-red-600" };
}

function calcQI(t1: number, t2: number) {
  return Math.min(160, Math.max(40, Math.round(100 + 15 * (t1 + t2 - 100) / 14.14)));
}

function WasiForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [vocab, setVocab]   = useState("");
  const [cubos, setCubos]   = useState("");
  const [semel, setSemel]   = useState("");
  const [racm,  setRacm]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const vT = Number(vocab) || 50;
  const cT = Number(cubos) || 50;
  const sT = Number(semel) || 50;
  const rT = Number(racm)  || 50;
  const qiV = calcQI(vT, sT);
  const qiE = calcQI(cT, rT);
  const qiTotal = Math.min(160, Math.max(40, Math.round(100 + 15 * (vT + cT + sT + rT - 200) / 20)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocab || !cubos || !semel || !racm) { setError("Preencha todos os escores T."); return; }
    setSubmitting(true); setError("");
    const res = await fetch(`/api/evaluations/${id}/tests/wasi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabularioT: vT, cubosT: cT, semelhancasT: sT, raciocMatricialT: rT }),
    });
    if (!res.ok) { setError("Erro ao salvar. Tente novamente."); setSubmitting(false); return; }
    router.push(`/evaluations/${id}`);
  };

  const subtests = [
    { label: "Vocabulário",           value: vocab, set: setVocab },
    { label: "Cubos",                 value: cubos, set: setCubos },
    { label: "Semelhanças",           value: semel, set: setSemel },
    { label: "Raciocínio Matricial",  value: racm,  set: setRacm  },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Avaliação</Link>
        <ChevronRight className="h-3 w-3" />
        <span>WASI</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">WASI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escala Wechsler Abreviada de Inteligência. Insira os <strong>escores T</strong> de cada subteste
          conforme a tabela normativa do manual.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "QI Verbal",    qi: qiV },
          { label: "QI Execução",  qi: qiE },
          { label: "QI Total",     qi: qiTotal },
        ].map(({ label, qi }) => {
          const cls = classifyQI(qi);
          return (
            <div key={label} className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-2xl font-bold ${cls.color}`}>{qi}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{cls.label}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Escores T dos Subtestes</CardTitle>
            <CardDescription>Valores entre 20 e 80 (média 50, DP 10).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subtests.map(({ label, value, set }) => (
                <div key={label} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input type="number" min={20} max={80} value={value}
                    onChange={(e) => set(e.target.value)} placeholder="50" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar WASI"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function WasiPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}><WasiForm /></Suspense>;
}
