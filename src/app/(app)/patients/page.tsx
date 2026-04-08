import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, calculateAge } from "@/lib/utils";
import { EDUCATION_LABELS, GENDER_LABELS } from "@/types";

// Dados mockados — substituir por Prisma query
const mockPatients = [
  {
    id: "1",
    fullName: "Ana Beatriz Silva",
    dateOfBirth: new Date("1992-03-15"),
    gender: "FEMALE" as const,
    educationLevel: "COMPLETE_HIGHER" as const,
    occupation: "Professora",
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "2",
    fullName: "Carlos Eduardo Mendes",
    dateOfBirth: new Date("1998-07-22"),
    gender: "MALE" as const,
    educationLevel: "INCOMPLETE_HIGHER" as const,
    occupation: "Estudante",
    createdAt: new Date("2026-03-28"),
  },
  {
    id: "3",
    fullName: "Fernanda Costa Lima",
    dateOfBirth: new Date("1981-11-08"),
    gender: "FEMALE" as const,
    educationLevel: "POSTGRADUATE" as const,
    occupation: "Engenheira",
    createdAt: new Date("2026-03-20"),
  },
];

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">{mockPatients.length} pacientes cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/patients/new">+ Novo Paciente</Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar paciente..." className="pl-9" />
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {mockPatients.map((patient) => {
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
                    <span>·</span>
                    <span>{EDUCATION_LABELS[patient.educationLevel]}</span>
                    {patient.occupation && (
                      <>
                        <span>·</span>
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
                    <Link href={`/evaluations/new?patientId=${patient.id}`}>Nova Avaliação</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
