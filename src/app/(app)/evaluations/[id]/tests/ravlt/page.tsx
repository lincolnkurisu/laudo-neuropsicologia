"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormState {
  trialA1: string;
  trialA2: string;
  trialA3: string;
  trialA4: string;
  trialA5: string;
  trialB1: string;
  recallShort: string;
  recallLong: string;
  recognitionHits: string;
  recognitionFP: string;
}

const DEFAULT_FORM: FormState = {
  trialA1: "",
  trialA2: "",
  trialA3: "",
  trialA4: "",
  trialA5: "",
  trialB1: "",
  recallShort: "",
  recallLong: "",
  recognitionHits: "",
  recognitionFP: "",
};

function parseIntOrNull(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

export default function RavltPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Live preview values
  const a1 = parseInt(form.trialA1, 10) || 0;
  const a2 = parseInt(form.trialA2, 10) || 0;
  const a3 = parseInt(form.trialA3, 10) || 0;
  const a4 = parseInt(form.trialA4, 10) || 0;
  const a5 = parseInt(form.trialA5, 10) || 0;
  const totalPreview = a1 + a2 + a3 + a4 + a5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trialA1 = parseIntOrNull(form.trialA1);
    const trialA2 = parseIntOrNull(form.trialA2);
    const trialA3 = parseIntOrNull(form.trialA3);
    const trialA4 = parseIntOrNull(form.trialA4);
    const trialA5 = parseIntOrNull(form.trialA5);
    const trialB1 = parseIntOrNull(form.trialB1);
    const recallShort = parseIntOrNull(form.recallShort);
    const recallLong = parseIntOrNull(form.recallLong);
    const recognitionHits = parseIntOrNull(form.recognitionHits);
    const recognitionFP = parseIntOrNull(form.recognitionFP);

    if (
      trialA1 === null || trialA2 === null || trialA3 === null ||
      trialA4 === null || trialA5 === null || trialB1 === null ||
      recallShort === null || recallLong === null
    ) {
      setError("Preencha todos os campos obrigatórios (A1–A5, B1, Recordação Imediata e Tardia).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/tests/ravlt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trialA1, trialA2, trialA3, trialA4, trialA5,
          trialB1,
          recallShort,
          recallLong,
          recognitionHits: form.recognitionHits.trim() === "" ? null : recognitionHits,
          recognitionFP: form.recognitionFP.trim() === "" ? null : recognitionFP,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ? JSON.stringify(data.error) : "Erro ao salvar o teste.");
        return;
      }

      router.push(`/evaluations/${id}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/evaluations" className="hover:text-primary">Avaliações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/evaluations/${id}`} className="hover:text-primary">Detalhes</Link>
        <ChevronRight className="h-3 w-3" />
        <span>RAVLT</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">RAVLT</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rey Auditory Verbal Learning Test — Aprendizagem e Memória Verbal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ensaios Lista A */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ensaios de Aprendizagem (Lista A)</CardTitle>
            <CardDescription>
              Número de palavras recordadas em cada ensaio (0–15)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-5 gap-4">
            {(["trialA1", "trialA2", "trialA3", "trialA4", "trialA5"] as const).map(
              (field, idx) => (
                <div key={field} className="space-y-1">
                  <Label htmlFor={field}>A{idx + 1}</Label>
                  <Input
                    id={field}
                    type="number"
                    min={0}
                    max={15}
                    placeholder="0"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Preview curva */}
        <Card className="bg-muted/40">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-1">Prévia — Curva de Aprendizagem</p>
            <p className="text-sm text-muted-foreground">
              {a1} → {a2} → {a3} → {a4} → {a5}
              <span className="ml-4 font-semibold text-foreground">
                Total: {totalPreview}/75
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Lista B */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista B — Interferência</CardTitle>
            <CardDescription>
              Número de palavras recordadas da Lista B (0–15)
            </CardDescription>
          </CardHeader>
          <CardContent className="w-32">
            <div className="space-y-1">
              <Label htmlFor="trialB1">B1</Label>
              <Input
                id="trialB1"
                type="number"
                min={0}
                max={15}
                placeholder="0"
                value={form.trialB1}
                onChange={(e) => handleChange("trialB1", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Recordação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recordação</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="recallShort">Recordação imediata (A6) — após Lista B</Label>
              <Input
                id="recallShort"
                type="number"
                min={0}
                max={15}
                placeholder="0"
                value={form.recallShort}
                onChange={(e) => handleChange("recallShort", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recallLong">Recordação tardia (A7) — após 20–30 min</Label>
              <Input
                id="recallLong"
                type="number"
                min={0}
                max={15}
                placeholder="0"
                value={form.recallLong}
                onChange={(e) => handleChange("recallLong", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Reconhecimento (opcional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reconhecimento (opcional)</CardTitle>
            <CardDescription>
              Deixe em branco se o reconhecimento não foi aplicado
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="recognitionHits">Acertos (máx. 15)</Label>
              <Input
                id="recognitionHits"
                type="number"
                min={0}
                max={15}
                placeholder="—"
                value={form.recognitionHits}
                onChange={(e) => handleChange("recognitionHits", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recognitionFP">Falsos positivos (máx. 15)</Label>
              <Input
                id="recognitionFP"
                type="number"
                min={0}
                max={15}
                placeholder="—"
                value={form.recognitionFP}
                onChange={(e) => handleChange("recognitionFP", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/evaluations/${id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Salvando…" : "Salvar RAVLT"}
          </Button>
        </div>
      </form>
    </div>
  );
}
