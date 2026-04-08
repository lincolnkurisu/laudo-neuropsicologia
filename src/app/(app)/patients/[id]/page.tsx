import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Plus, FileText, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatDate, calculateAge } from "@/lib/utils";
import { EDUCATION_LABELS, GENDER_LABELS } from "@/types";

// Mock — substituir por Prisma
async function getPatient(id: string) {
  const patients: Record<string, object> = {
    "1": {
      id: "1",
      fullName: "Ana Beatriz Silva",
      dateOfBirth: new Date("1992-03-15"),
      gender: "FEMALE",
      educationLevel: "COMPLETE_HIGHER",
      occupation: "Professora",
      phone: "(11) 98765-4321",
      email: "ana.silva@email.com",
      createdAt: new Date("2026-04-01"),
      anamneses: [
        {
          id: "a1",
          mainComplaint: "Dificuldades de concentração e memória no trabalho",
          createdAt: new Date("2026-04-02"),
        },
      ],
      evaluations: [
        {
          id: "e1",
          title: "Avaliação Neuropsicológica Completa",
          status: "IN_PROGRESS",
          createdAt: new Date("2026-04-03"),
        },
      ],
    },
  };
  return patients[id] || null;
}

interface PatientPageProps {
  params: { id: string };
}

export default async function PatientPage({ params }: PatientPageProps) {
  const patient = await getPatient(params.id) as {
    id: string;
    fullName: string;
    dateOfBirth: Date;
    gender: "MALE" | "FEMALE" | "OTHER";
    educationLevel: "NO_FORMAL_EDUCATION" | "INCOMPLETE_ELEMENTARY" | "COMPLETE_ELEMENTARY" | "INCOMPLETE_HIGH_SCHOOL" | "COMPLETE_HIGH_SCHOOL" | "INCOMPLETE_HIGHER" | "COMPLETE_HIGHER" | "POSTGRADUATE";
    occupation?: string;
    phone?: string;
    email?: string;
    createdAt: Date;
    anamneses: { id: string; mainComplaint: string; createdAt: Date }[];
    evaluations: { id: string; title: string; status: string; createdAt: Date }[];
  } | null;

  if (!patient) notFound();

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
            <Badge variant="outline">{GENDER_LABELS[patient.gender]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {age} anos · {EDUCATION_LABELS[patient.educationLevel]}
            {patient.occupation ? ` · ${patient.occupation}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={`/evaluations/new?patientId=${patient.id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Avaliação
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="anamneses">
            <ClipboardList className="mr-2 h-4 w-4" />
            Anamneses ({patient.anamneses.length})
          </TabsTrigger>
          <TabsTrigger value="evaluations">
            <FileText className="mr-2 h-4 w-4" />
            Avaliações ({patient.evaluations.length})
          </TabsTrigger>
        </TabsList>

        {/* Dados pessoais */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
              <CardDescription>Dados demográficos e de contato.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nome completo", value: patient.fullName },
                  { label: "Data de nascimento", value: `${formatDate(patient.dateOfBirth)} (${age} anos)` },
                  { label: "Gênero", value: GENDER_LABELS[patient.gender] },
                  { label: "Escolaridade", value: EDUCATION_LABELS[patient.educationLevel] },
                  { label: "Ocupação", value: patient.occupation || "—" },
                  { label: "Telefone", value: patient.phone || "—" },
                  { label: "Email", value: patient.email || "—" },
                  { label: "Cadastrado em", value: formatDate(patient.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>

              <Separator className="my-6" />

              <Button variant="outline" asChild>
                <Link href={`/patients/${patient.id}/anamnesis/new`}>
                  + Registrar Anamnese
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anamneses */}
        <TabsContent value="anamneses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Anamneses</CardTitle>
                  <CardDescription>Histórico clínico e relatos do paciente.</CardDescription>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/patients/${patient.id}/anamnesis/new`}>+ Nova Anamnese</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.anamneses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma anamnese registrada.</p>
              ) : (
                <div className="space-y-3">
                  {patient.anamneses.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Queixa: {a.mainComplaint}</p>
                        <p className="text-sm text-muted-foreground">Registrada em {formatDate(a.createdAt)}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${patient.id}/anamnesis/${a.id}`}>Ver</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avaliações */}
        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Avaliações</CardTitle>
                  <CardDescription>Sessões de avaliação neuropsicológica.</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/evaluations/new?patientId=${patient.id}`}>+ Nova Avaliação</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.evaluations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma avaliação iniciada.</p>
              ) : (
                <div className="space-y-3">
                  {patient.evaluations.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-sm text-muted-foreground">Iniciada em {formatDate(ev.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={ev.status === "IN_PROGRESS" ? "warning" : ev.status === "COMPLETED" ? "secondary" : "success"}>
                          {ev.status === "IN_PROGRESS" ? "Em andamento" : ev.status === "COMPLETED" ? "Concluída" : "Laudo gerado"}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/evaluations/${ev.id}`}>Abrir</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
