"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight, Brain } from "lucide-react";

function classifyTotal(total: number) {
  if (total >= 35) return { label: "Normal / Superior", color: "text-blue-600" };
  if (total >= 28) return { label: "Médio",              color: "text-green-600" };
  if (total >= 20) return { label: "Médio-Inferior",     color: "text-yellow-600" };
  return                  { label: "Rebaixado",          color: "text-red-600" };
}

function FauxPasForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [detection,    setDetection]    = useState("");
  const [understanding, setUnderstanding] = useState("");
  const [empathy,      setEmpathy]      = useState("");
  const [control,      setControl]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState("");

  const d = parseInt(detection)    || 0;
  const u = parseInt(understanding) || 0;
  const e = parseInt(empathy)      || 0;
  const c = parseInt(control)      || 0;

  const fauxPasSubtotal = d + u + e;
  const total           = fauxPasSubtotal + c;
  const tomIndex        = fauxPasSubtotal > 0 ? Math.round((fauxPasSubtotal / 30) * 1000) / 10 : 0;
  const cls             = total > 0 ? classifyTotal(total) : null;

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!detection || !understanding || !empathy || !control) {
      setFormError("Preencha todos os campos."); return;
    }
    setSubmitting(true); setFormError("");
    const res = await fetch(`/api/evaluations/${id}/tests/fauxpas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        detectionScore:     d,
        understandingScore: u,
        empathyScore:       e,
        controlScore:       c,
      }),
    });
    if (!res.ok) { setFormError("Erro ao salvar. Tente novamente."); setSubmitting(false); return; }
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
        <span>Faux Pas</span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-500" />
          <h1 className="text-xl font-bold">Teste de Faux Pas</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Avaliação de Teoria da Mente (ToM) e cognição social. 10 histórias com faux pas + 10 histórias controle.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Detecção</p>
          <p className={`text-2xl font-bold ${d > 0 ? "text-indigo-600" : "text-muted-foreground"}`}>
            {d > 0 ? `${d}/10` : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Compreensão</p>
          <p className={`text-2xl font-bold ${u > 0 ? "text-indigo-600" : "text-muted-foreground"}`}>
            {u > 0 ? `${u}/10` : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Empatia</p>
          <p className={`text-2xl font-bold ${e > 0 ? "text-indigo-600" : "text-muted-foreground"}`}>
            {e > 0 ? `${e}/10` : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Controle</p>
          <p className={`text-2xl font-bold ${c > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
            {c > 0 ? `${c}/10` : "—"}
          </p>
        </div>
      </div>

      {/* Totais ao vivo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Subtotal ToM</p>
          <p className="text-2xl font-bold text-indigo-600">{fauxPasSubtotal > 0 ? fauxPasSubtotal : "—"}</p>
          <p className="text-[10px] text-muted-foreground">D + C + E / 30</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Índice ToM</p>
          <p className={`text-2xl font-bold ${tomIndex >= 80 ? "text-green-600" : tomIndex >= 60 ? "text-yellow-600" : "text-red-600"}`}>
            {tomIndex > 0 ? `${tomIndex}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Total Geral</p>
          <p className={`text-2xl font-bold ${cls?.color ?? "text-muted-foreground"}`}>
            {total > 0 ? `${total}/40` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{cls?.label ?? ""}</p>
        </div>
      </div>

      {/* Explicação dos domínios */}
      <Card className="bg-muted/40">
        <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
          <p><span className="font-semibold text-foreground">Detecção:</span> O participante percebeu que algo inadequado foi dito?</p>
          <p><span className="font-semibold text-foreground">Compreensão:</span> Entendeu por que foi inadequado (intenção × conhecimento)?</p>
          <p><span className="font-semibold text-foreground">Empatia:</span> Atribuiu corretamente o estado emocional do personagem afetado?</p>
          <p><span className="font-semibold text-foreground">Controle:</span> Identificou corretamente que NÃO havia faux pas nas histórias controle?</p>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Histórias com Faux Pas (10 histórias)</CardTitle>
            <CardDescription>Pontuação máxima: 10 pontos por domínio</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Detecção (0–10) *</Label>
              <Input type="number" min={0} max={10} value={detection}
                onChange={(e) => setDetection(e.target.value)} placeholder="0" required />
              <p className="text-[10px] text-muted-foreground">Identificou o faux pas</p>
            </div>
            <div className="space-y-1.5">
              <Label>Compreensão (0–10) *</Label>
              <Input type="number" min={0} max={10} value={understanding}
                onChange={(e) => setUnderstanding(e.target.value)} placeholder="0" required />
              <p className="text-[10px] text-muted-foreground">Entendeu o motivo</p>
            </div>
            <div className="space-y-1.5">
              <Label>Empatia (0–10) *</Label>
              <Input type="number" min={0} max={10} value={empathy}
                onChange={(e) => setEmpathy(e.target.value)} placeholder="0" required />
              <p className="text-[10px] text-muted-foreground">Estado mental do personagem</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Histórias Controle (10 histórias sem faux pas)</CardTitle>
            <CardDescription>Número de histórias corretamente identificadas como sem faux pas (0–10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-w-[10rem]">
              <Label>Controle (0–10) *</Label>
              <Input type="number" min={0} max={10} value={control}
                onChange={(e) => setControl(e.target.value)} placeholder="0" required />
            </div>
          </CardContent>
        </Card>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Faux Pas"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function FauxPasPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <FauxPasForm />
    </Suspense>
  );
}
