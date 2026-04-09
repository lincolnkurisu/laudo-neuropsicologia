"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, calculateAge } from "@/lib/utils";
import { EDUCATION_LABELS, GENDER_LABELS } from "@/types";
import type { EducationLevel, Gender } from "@/generated/prisma";

interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  educationLevel: EducationLevel;
  occupation?: string | null;
  createdAt: string;
  _count?: { evaluations: number; anamneses: number };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar pacientes");
        return r.json();
      })
      .then((data) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q)
    );
  }, [search, patients]);

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mt-1">
            {loading
              ? "Carregando..."
              : filtered.length === patients.length
              ? `${patients.length} paciente${patients.length !== 1 ? "s" : ""} cadastrado${patients.length !== 1 ? "s" : ""}`
              : `${filtered.length} de ${patients.length} pacientes`}
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">+ Novo Paciente</Link>
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Buscar por nome ou ocupação..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Pesquisar pacientes"
          disabled={loading}
        />
      </div>

      {/* Estados */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando pacientes...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="font-medium text-destructive">Erro ao carregar pacientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique a conexão com o banco de dados.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UserX className="h-7 w-7 text-muted-foreground" />
            </div>
          </div>
          <p className="font-semibold text-foreground">
            {patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhum resultado"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {patients.length === 0
              ? "Cadastre o primeiro paciente para começar."
              : `Nenhum paciente com "${search}".`}
          </p>
          {patients.length === 0 && (
            <Button asChild className="mt-5">
              <Link href="/patients/new">Cadastrar primeiro paciente</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((patient) => {
            const age = calculateAge(new Date(patient.dateOfBirth));
            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-5">
                  <Avatar name={patient.fullName} size="lg" />

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base">{patient.fullName}</span>
                      <Badge variant="outline" className="text-xs">
                        {GENDER_LABELS[patient.gender]}
                      </Badge>
                      {patient._count && patient._count.evaluations > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {patient._count.evaluations} avaliação{patient._count.evaluations !== 1 ? "ões" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
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
                    <p className="text-xs text-muted-foreground/70">
                      Cadastrado em {formatDate(new Date(patient.createdAt))}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
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
