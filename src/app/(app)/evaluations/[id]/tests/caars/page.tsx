"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

interface Subscale {
  key: keyof ScoreState;
  label: string;
  abbr: string;
}

const SUBSCALES: Subscale[] = [
  { key: "inattentionT",       label: "Desatenção / Problemas de Memória",                   abbr: "IA"       },
  { key: "hyperactivityT",     label: "Hiperatividade / Agitação",                            abbr: "HR"       },
  { key: "impulsivityT",       label: "Impulsividade / Labilidade Emocional",                 abbr: "IE"       },
  { key: "selfConceptT",       label: "Problemas com Auto-Conceito",                          abbr: "SC"       },
  { key: "dsmInattentionT",    label: "Sintomas de Desatenção DSM-5",                         abbr: "DSM-IA"   },
  { key: "dsmHyperactivityT",  label: "Sintomas de Hiperatividade-Impulsividade DSM-5",       abbr: "DSM-HI"   },
  { key: "adhdIndexT",         label: "Índice de TDAH",                                       abbr: "ADHD Index" },
];

interface ScoreState {
  inattentionT: string;
  hyperactivityT: string;
  impulsivityT: string;
  selfConceptT: string;
  dsmInattentionT: string;
  dsmHyperactivityT: string;
  adhdIndexT: string;
}

function classifyT(raw: string): { label: string; color: string } | null {
  const t = parseInt(raw);
  if (isNaN(t) || raw.trim() === "") return null;
  if (t >= 70) return { label: "Marcadamente Atípico",      color: "text-red-600"    };
  if (t >= 65) return { label: "Significativamente Atípico", color: "text-orange-600" };
  if (t >= 60) return { label: "Levemente Atípico",          color: "text-yellow-600" };
  return             { label: "Dentro do Esperado",          color: "text-green-600"  };
}

function CaarsForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [scores, setScores] = useState<ScoreState>({
    inattentionT:      "",
    hyperactivityT:    "",
    impulsivityT:      "",
    selfConceptT:      "",
    dsmInattentionT:   "",
    dsmHyperactivityT: "",
    adhdIndexT:        "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const setField = (key: keyof ScoreState, value: string) =>
    setScores((prev) => ({ ...prev, [key]: value }));

  const adhdClass = classifyT(scores.adhdIndexT);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const anyEmpty = SUBSCALES.some(({ key }) => scores[key].trim() === "");
    if (anyEmpty) { setFormError("Preencha todos os campos de escore T."); return; }
    setSubmitting(true);
    setFormError("");
    const body = Object.fromEntries(
      SUBSCALES.map(({ key }) => [key, parseInt(scores[key])])
    );
    const res = await fetch(`/api/evaluations/${id}/tests/caars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
        <span>CAARS</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">CAARS</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conners' Adult ADHD Rating Scales — insira os escores T obtidos no manual.
        </p>
      </div>

      {/* ADHD Index summary panel */}
      <div className="rounded-lg border p-4 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Índice de TDAH (ADHD Index)</p>
        <div className="flex items-baseline gap-3">
          <p className={`text-3xl font-bold ${adhdClass?.color ?? "text-muted-foreground"}`}>
            {scores.adhdIndexT !== "" ? scores.adhdIndexT : "—"}
          </p>
          <p className={`text-sm font-medium ${adhdClass?.color ?? "text-muted-foreground"}`}>
            {adhdClass?.label ?? "aguardando escore"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">T ≥ 65 indica probabilidade clínica de TDAH.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Escores T por Subescala</CardTitle>
            <CardDescription>
              Consulte o manual do CAARS e insira o escore T padronizado para cada subescala.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {SUBSCALES.map(({ key, label, abbr }) => {
                const cls = classifyT(scores[key]);
                return (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key} className="text-xs leading-tight block">
                      <span className="font-semibold">{abbr}</span>
                      <span className="block text-muted-foreground font-normal leading-tight mt-0.5">{label}</span>
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      min={20}
                      max={90}
                      value={scores[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      placeholder="T"
                      required
                    />
                    {cls ? (
                      <p className={`text-[10px] font-medium ${cls.color}`}>{cls.label}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">—</p>
                    )}
                  </div>
                );
              })}
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
              "Salvar CAARS"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CaarsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <CaarsForm />
    </Suspense>
  );
}
