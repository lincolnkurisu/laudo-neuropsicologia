"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

function classifyFas(total: number) {
  if (total >= 45) return { label: "Superior",       color: "text-blue-600" };
  if (total >= 36) return { label: "Médio-Superior", color: "text-green-600" };
  if (total >= 27) return { label: "Médio",          color: "text-green-600" };
  if (total >= 18) return { label: "Médio-Inferior", color: "text-yellow-600" };
  return               { label: "Rebaixado",         color: "text-red-600" };
}

function classifyAnimais(n: number) {
  if (n >= 22) return { label: "Superior",       color: "text-blue-600" };
  if (n >= 17) return { label: "Médio-Superior", color: "text-green-600" };
  if (n >= 13) return { label: "Médio",          color: "text-green-600" };
  if (n >= 9)  return { label: "Médio-Inferior", color: "text-yellow-600" };
  return           { label: "Rebaixado",         color: "text-red-600" };
}

function FluenciaForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [fasF, setFasF] = useState("");
  const [fasA, setFasA] = useState("");
  const [fasS, setFasS] = useState("");
  const [animais, setAnimais] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const f = parseInt(fasF) || 0;
  const a = parseInt(fasA) || 0;
  const s = parseInt(fasS) || 0;
  const anim = parseInt(animais) || 0;
  const fasTotal = f + a + s;

  const fasClass = fasTotal > 0 ? classifyFas(fasTotal) : null;
  const animClass = anim > 0 ? classifyAnimais(anim) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fasF || !fasA || !fasS || !animais) { setFormError("Preencha todos os campos."); return; }
    setSubmitting(true); setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/fluencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fasF: f, fasA: a, fasS: s, animais: anim }),
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
        <span>Fluência Verbal</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">Fluência Verbal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registre o número de palavras produzidas em 60 segundos para cada categoria.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">FAS Total</p>
          <p className={`text-2xl font-bold ${fasClass?.color ?? "text-muted-foreground"}`}>
            {fasTotal > 0 ? fasTotal : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{fasClass?.label ?? "F + A + S"}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Animais</p>
          <p className={`text-2xl font-bold ${animClass?.color ?? "text-muted-foreground"}`}>
            {anim > 0 ? anim : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{animClass?.label ?? ""}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fluência Fonêmica — FAS</CardTitle>
            <CardDescription>Número de palavras iniciadas com cada letra em 60 segundos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {([["F", fasF, setFasF], ["A", fasA, setFasA], ["S", fasS, setFasS]] as const).map(([letter, val, setter]) => (
                <div key={letter} className="space-y-1.5">
                  <Label>Letra {letter} *</Label>
                  <Input type="number" min={0} value={val}
                    onChange={(e) => setter(e.target.value)} placeholder="0" required />
                </div>
              ))}
            </div>
            {fasTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Total FAS: <span className="font-semibold text-foreground">{fasTotal}</span> ({f} + {a} + {s})
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fluência Semântica — Animais</CardTitle>
            <CardDescription>Número de animais nomeados em 60 segundos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-w-[10rem]">
              <Label>Animais *</Label>
              <Input type="number" min={0} value={animais}
                onChange={(e) => setAnimais(e.target.value)} placeholder="0" required />
            </div>
          </CardContent>
        </Card>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Fluência Verbal"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function FluenciaPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}><FluenciaForm /></Suspense>;
}
