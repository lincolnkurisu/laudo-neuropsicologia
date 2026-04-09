"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Patient {
  id: string;
  fullName: string;
}

function NewEvaluationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId") ?? "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [title, setTitle] = useState("Avaliação Neuropsicológica");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError("Selecione um paciente."); return; }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, title }),
    });

    if (!res.ok) {
      setError("Erro ao criar avaliação. Tente novamente.");
      setSubmitting(false);
      return;
    }

    const evaluation = await res.json();
    router.push(`/evaluations/${evaluation.id}`);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Avaliação</h1>
        <p className="text-muted-foreground mt-1">
          Selecione o paciente e inicie a avaliação neuropsicológica.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Avaliação</CardTitle>
            <CardDescription>Escolha o paciente e o título da avaliação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente *</Label>
              {loadingPatients ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando pacientes...
                </div>
              ) : patients.length === 0 ? (
                <p className="text-sm text-destructive">
                  Nenhum paciente cadastrado.{" "}
                  <Link href="/patients/new" className="underline">Cadastrar paciente</Link>
                </p>
              ) : (
                <select
                  id="patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2
                             text-sm ring-offset-background focus:outline-none focus:ring-2
                             focus:ring-ring focus:ring-offset-2"
                  required
                >
                  <option value="">Selecione um paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da avaliação</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Avaliação Neuropsicológica"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || loadingPatients || patients.length === 0}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : "Iniciar Avaliação"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NewEvaluationForm />
    </Suspense>
  );
}
