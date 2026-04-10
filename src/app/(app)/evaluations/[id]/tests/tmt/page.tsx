"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";

type Classification = { label: string; color: string };

function classifyPartA(seconds: number): Classification {
  if (seconds <= 29) return { label: "Superior", color: "text-blue-600" };
  if (seconds <= 45) return { label: "Médio", color: "text-green-600" };
  if (seconds <= 78) return { label: "Limítrofe", color: "text-yellow-600" };
  return { label: "Rebaixado", color: "text-red-600" };
}

function classifyPartB(seconds: number): Classification {
  if (seconds <= 58) return { label: "Superior", color: "text-blue-600" };
  if (seconds <= 91) return { label: "Médio", color: "text-green-600" };
  if (seconds <= 150) return { label: "Limítrofe", color: "text-yellow-600" };
  return { label: "Rebaixado", color: "text-red-600" };
}

function TmtForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [partATime, setPartATime] = useState<string>("");
  const [partAErrors, setPartAErrors] = useState<string>("0");
  const [partBTime, setPartBTime] = useState<string>("");
  const [partBErrors, setPartBErrors] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const aTime = parseFloat(partATime) || 0;
  const bTime = parseFloat(partBTime) || 0;

  const classA = aTime > 0 ? classifyPartA(aTime) : null;
  const classB = bTime > 0 ? classifyPartB(bTime) : null;
  const ratio = aTime > 0 && bTime > 0 ? (bTime / aTime).toFixed(2) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/evaluations/${id}/tests/tmt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partATime: parseFloat(partATime),
        partAErrors: parseInt(partAErrors) || 0,
        partBTime: parseFloat(partBTime),
        partBErrors: parseInt(partBErrors) || 0,
      }),
    });
    if (!res.ok) {
      setError("Erro ao salvar. Tente novamente.");
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
        <span>TMT</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">Trail Making Test (TMT)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Partes A e B — avaliação de atenção, velocidade de processamento e flexibilidade cognitiva.
        </p>
      </div>

      {/* Live score preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Parte A</p>
          <p className="text-lg font-bold text-indigo-600">
            {aTime > 0 ? `${aTime}s` : "—"}
          </p>
          {classA && (
            <p className={`text-sm font-semibold ${classA.color}`}>{classA.label}</p>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Parte B</p>
          <p className="text-lg font-bold text-indigo-600">
            {bTime > 0 ? `${bTime}s` : "—"}
          </p>
          {classB && (
            <p className={`text-sm font-semibold ${classB.color}`}>{classB.label}</p>
          )}
        </div>
        <div className="rounded-lg border p-3 col-span-2 text-center">
          <p className="text-xs text-muted-foreground mb-1">Razão B/A</p>
          <p className="text-xl font-bold text-indigo-600">{ratio ?? "—"}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Parte A */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parte A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partATime">Tempo (segundos)</Label>
                <Input
                  id="partATime"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="ex: 32"
                  value={partATime}
                  onChange={(e) => setPartATime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="partAErrors">Erros</Label>
                <Input
                  id="partAErrors"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={partAErrors}
                  onChange={(e) => setPartAErrors(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parte B */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parte B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partBTime">Tempo (segundos)</Label>
                <Input
                  id="partBTime"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="ex: 85"
                  value={partBTime}
                  onChange={(e) => setPartBTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="partBErrors">Erros</Label>
                <Input
                  id="partBErrors"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={partBErrors}
                  onChange={(e) => setPartBErrors(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar TMT"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function TmtPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TmtForm />
    </Suspense>
  );
}
