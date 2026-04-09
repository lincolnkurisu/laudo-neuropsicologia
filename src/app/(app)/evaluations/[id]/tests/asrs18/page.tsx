"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight } from "lucide-react";

const LIKERT = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Muito frequentemente"];

const ITEMS_PART_A = [
  "Com que frequência você comete erros por falta de atenção em tarefas?",
  "Com que frequência você tem dificuldade em manter a atenção em tarefas longas?",
  "Com que frequência você tem dificuldade em se concentrar no que as pessoas dizem?",
  "Com que frequência você deixa um trabalho pela metade depois de já ter feito a parte difícil?",
  "Com que frequência você tem dificuldade em organizar tarefas e atividades?",
  "Com que frequência você evita ou adia tarefas que exigem muita concentração?",
  "Com que frequência você perde coisas necessárias para o trabalho ou atividades?",
  "Com que frequência você se distrai com barulho ou atividades ao redor?",
  "Com que frequência você tem dificuldade de lembrar compromissos ou obrigações?",
];

const ITEMS_PART_B = [
  "Com que frequência você se mexe ou torce as mãos quando tem que ficar sentado por muito tempo?",
  "Com que frequência você se levanta quando deveria continuar sentado?",
  "Com que frequência você se sente inquieto ou irrequieto?",
  "Com que frequência você tem dificuldade de descansar e relaxar em momentos livres?",
  "Com que frequência você se sente ativo demais e com necessidade de fazer coisas?",
  "Com que frequência você fala demais em situações sociais?",
  "Com que frequência você completa frases das pessoas ou fala antes que terminem?",
  "Com que frequência você tem dificuldade em esperar a sua vez em situações que exigem isso?",
  "Com que frequência você interrompe as atividades ou conversas de outras pessoas?",
];

function ItemRow({ index, label, value, onChange }: {
  index: number; label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-sm font-medium">{index}. {label}</p>
      <div className="flex flex-wrap gap-1.5">
        {LIKERT.map((lbl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors
              ${value === i
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-border bg-background hover:bg-accent"}`}
          >
            {i} – {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function Asrs18Form() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<number[]>(Array(18).fill(0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (idx: number, val: number) =>
    setItems((prev) => { const n = [...prev]; n[idx] = val; return n; });

  const scoreA = items.slice(0, 9).reduce((s, v) => s + v, 0);
  const scoreB = items.slice(9).reduce((s, v) => s + v, 0);
  const posA = items.slice(0, 9).filter((v) => v >= 3).length;
  const posB = items.slice(9).filter((v) => v >= 3).length;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/evaluations/${id}/tests/asrs18`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) { setError("Erro ao salvar. Tente novamente."); setSubmitting(false); return; }
    router.push(`/evaluations/${id}`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Avaliação</Link>
        <ChevronRight className="h-3 w-3" />
        <span>ASRS-18</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">ASRS-18</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escala de Autoavaliação de TDAH em Adultos — 18 itens (OMS). Selecione a frequência de cada comportamento.
        </p>
      </div>

      {/* Painel de pontuação ao vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Parte A (Desatenção)", value: scoreA, max: 36 },
          { label: "Parte B (Hiper./Imp.)", value: scoreB, max: 36 },
          { label: "Total", value: scoreA + scoreB, max: 72 },
          { label: "Itens pos. A / B", value: `${posA} / ${posB}`, max: null },
        ].map(({ label, value, max }) => (
          <div key={label} className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-indigo-600">
              {value}{max && <span className="text-sm text-muted-foreground font-normal">/{max}</span>}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            Parte A — Desatenção <Badge variant="outline" className="text-[10px]">Itens 1–9</Badge>
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ITEMS_PART_A.map((label, i) => (
              <ItemRow key={i} index={i + 1} label={label} value={items[i]} onChange={(v) => set(i, v)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            Parte B — Hiperatividade / Impulsividade <Badge variant="outline" className="text-[10px]">Itens 10–18</Badge>
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ITEMS_PART_B.map((label, i) => (
              <ItemRow key={i} index={i + 10} label={label} value={items[i + 9]} onChange={(v) => set(i + 9, v)} />
            ))}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar ASRS-18"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Asrs18Page() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}><Asrs18Form /></Suspense>;
}
