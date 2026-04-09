"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function NumInput({ id, label, value, onChange, max }: {
  id: string; label: string; value: string; onChange: (v: string) => void; max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} max={max} value={value}
        onChange={(e) => onChange(e.target.value)} placeholder="0" />
    </div>
  );
}

function Bpa2Form() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [fields, setFields] = useState({ cA: "", cE: "", dA: "", dE: "", aA: "", aE: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof fields) => (v: string) => setFields((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    const res = await fetch(`/api/evaluations/${id}/tests/bpa2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        concentradaAcertos: Number(fields.cA), concentradaErros: Number(fields.cE),
        divididaAcertos:    Number(fields.dA), divididaErros:    Number(fields.dE),
        alternadaAcertos:   Number(fields.aA), alternadaErros:   Number(fields.aE),
      }),
    });
    if (!res.ok) { setError("Erro ao salvar. Tente novamente."); setSubmitting(false); return; }
    router.push(`/evaluations/${id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Avaliação</Link>
        <ChevronRight className="h-3 w-3" />
        <span>BPA-2</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">BPA-2</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bateria de Provas de Atenção. Registre os acertos e erros de cada subteste.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {[
          { title: "Atenção Concentrada", desc: "Tarefa de cancelamento — detecção de estímulos-alvo.", aKey: "cA" as const, eKey: "cE" as const },
          { title: "Atenção Dividida",    desc: "Tarefa com dois estímulos simultâneos.",              aKey: "dA" as const, eKey: "dE" as const },
          { title: "Atenção Alternada",   desc: "Alternância entre dois tipos de estímulo.",           aKey: "aA" as const, eKey: "aE" as const },
        ].map(({ title, desc, aKey, eKey }) => (
          <Card key={title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <NumInput id={`${aKey}`} label="Acertos" value={fields[aKey]} onChange={set(aKey)} max={120} />
                <NumInput id={`${eKey}`} label="Erros"   value={fields[eKey]} onChange={set(eKey)} max={120} />
              </div>
            </CardContent>
          </Card>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar BPA-2"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Bpa2Page() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}><Bpa2Form /></Suspense>;
}
