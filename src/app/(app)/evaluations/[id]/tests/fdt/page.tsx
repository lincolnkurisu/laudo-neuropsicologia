"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

const CONDITIONS = [
  { key: "leitura",    label: "1 — Leitura",    desc: "Leitura de algarismos (sem interferência)" },
  { key: "contagem",   label: "2 — Contagem",   desc: "Contar os pontos dentro das figuras" },
  { key: "escolha",    label: "3 — Escolha",    desc: "Escolha (inibição de resposta automática)" },
  { key: "alternancia",label: "4 — Alternância",desc: "Alternância entre leitura e contagem (flexibilidade)" },
] as const;

function FdtForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [times,  setTimes]  = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const setT = (k: string, v: string) => setTimes((p) => ({ ...p, [k]: v }));
  const setE = (k: string, v: string) => setErrors((p) => ({ ...p, [k]: v }));

  const tL = Number(times.leitura)     || 0;
  const tC = Number(times.contagem)    || 0;
  const tEs = Number(times.escolha)    || 0;
  const tAl = Number(times.alternancia)|| 0;
  const base = (tL + tC) / 2;
  const inhibition  = base > 0 ? tEs / base  : 0;
  const flexibility = base > 0 ? tAl / base  : 0;

  const classify = (r: number) => r === 0 ? "—" : r < 1.5 ? "Adequado" : r <= 2.0 ? "Limítrofe" : "Alterado";
  const color = (r: number) => r === 0 ? "" : r < 1.5 ? "text-green-600" : r <= 2.0 ? "text-yellow-600" : "text-red-600";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (CONDITIONS.some((c) => !times[c.key])) { setFormError("Preencha o tempo de todas as condições."); return; }
    setSubmitting(true); setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/fdt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leituraTime:       Number(times.leitura),     leituraErrors:     Number(errors.leitura     || 0),
        contagemTime:      Number(times.contagem),    contagemErrors:    Number(errors.contagem    || 0),
        escolhaTime:       Number(times.escolha),     escolhaErrors:     Number(errors.escolha     || 0),
        alternanciaTime:   Number(times.alternancia), alternanciaErrors: Number(errors.alternancia || 0),
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
        <span>FDT</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">FDT — Five Digit Test</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Avaliação das funções executivas (inibição e flexibilidade cognitiva).
          Registre o tempo em segundos e o número de erros de cada condição.
        </p>
      </div>

      {/* Índices ao vivo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Índice de Inibição</p>
          <p className={`text-2xl font-bold ${color(inhibition)}`}>{inhibition ? inhibition.toFixed(2) : "—"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{classify(inhibition)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Índice de Flexibilidade</p>
          <p className={`text-2xl font-bold ${color(flexibility)}`}>{flexibility ? flexibility.toFixed(2) : "—"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{classify(flexibility)}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {CONDITIONS.map(({ key, label, desc }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{label}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tempo (segundos) *</Label>
                  <Input type="number" min={0} step="0.1" value={times[key] || ""}
                    onChange={(e) => setT(key, e.target.value)} placeholder="Ex: 28.5" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Erros</Label>
                  <Input type="number" min={0} value={errors[key] || ""}
                    onChange={(e) => setE(key, e.target.value)} placeholder="0" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar FDT"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function FdtPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}><FdtForm /></Suspense>;
}
