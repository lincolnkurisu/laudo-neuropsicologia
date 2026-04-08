"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, calculateAge } from "@/lib/utils";
import { EDUCATION_LABELS, GENDER_LABELS } from "@/types";
import { MOCK_PATIENTS } from "@/lib/constants";

export default function PatientsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_PATIENTS;
    return MOCK_PATIENTS.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            {filtered.length === MOCK_PATIENTS.length
              ? `${MOCK_PATIENTS.length} pacientes cadastrados`
              : `${filtered.length} de ${MOCK_PATIENTS.length} pacientes`}
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">+ Novo Paciente</Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Buscar por nome ou ocupação..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Pesquisar pacientes por nome ou ocupação"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="font-medium">Nenhum paciente encontrado</p>
          <p className="text-sm mt-1">Tente um termo diferente ou cadastre um novo paciente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((patient) => {
            const age = calculateAge(patient.dateOfBirth);
            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{patient.fullName}</span>
                      <Badge variant="outline">{GENDER_LABELS[patient.gender]}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{age} anos</span>
                      <span aria-hidden="true">·</span>
                      <span>{EDUCATION_LABELS[patient.educationLevel]}</span>
                      {patient.occupation && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{patient.occupation}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cadastrado em {formatDate(patient.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/patients/${patient.id}`}>Ver perfil</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/evaluations/new?patientId=${patient.id}`}>
                        Nova Avaliação
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
