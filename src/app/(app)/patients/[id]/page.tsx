import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClipboardList, Plus, FileText, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, calculateAge } from "@/lib/utils";
import { EDUCATION_LABELS, GENDER_LABELS } from "@/types";
import { STATUS_CONFIG } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, userId: session.user.id },
    include: {
      anamneses: {
        orderBy: { createdAt: "desc" },
        select: { id: true, mainComplaint: true, createdAt: true },
      },
      evaluations: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
      },
    },
  });

  if (!patient) notFound();

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={patient.fullName} size="xl" />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{patient.fullName}</h1>
              <Badge variant="outline">{GENDER_LABELS[patient.gender]}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {age} anos · {EDUCATION_LABELS[patient.educationLevel]}
              {patient.occupation ? ` · ${patient.occupation}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cadastrado em {formatDate(patient.createdAt)}
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/evaluations/new?patientId=${patient.id}`}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nova Avaliação
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="anamneses">
            <ClipboardList className="mr-2 h-4 w-4" aria-hidden="true" />
            Anamneses ({patient.anamneses.length})
          </TabsTrigger>
          <TabsTrigger value="evaluations">
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
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
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nome completo",      value: patient.fullName },
                  { label: "Data de nascimento", value: `${formatDate(patient.dateOfBirth)} (${age} anos)` },
                  { label: "Gênero",             value: GENDER_LABELS[patient.gender] },
                  { label: "Escolaridade",        value: EDUCATION_LABELS[patient.educationLevel] },
                  { label: "Ocupação",            value: patient.occupation ?? "—" },
                  { label: "Telefone",            value: patient.phone ?? "—" },
                  { label: "Email",               value: patient.email ?? "—" },
                  { label: "CPF",                 value: patient.cpf ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">{value}</dd>
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
                <div className="text-center py-10 text-muted-foreground">
                  <p className="font-medium">Nenhuma anamnese registrada</p>
                  <p className="text-sm mt-1">Clique em &quot;Nova Anamnese&quot; para começar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patient.anamneses.map((a) => (
                    <div key={a.id}
                      className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">{a.mainComplaint}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Registrada em {formatDate(a.createdAt)}
                        </p>
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
                  <Link href={`/evaluations/new?patientId=${patient.id}`}>
                    + Nova Avaliação
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.evaluations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="font-medium">Nenhuma avaliação iniciada</p>
                  <p className="text-sm mt-1">Clique em &quot;Nova Avaliação&quot; para começar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patient.evaluations.map((ev) => {
                    const cfg = STATUS_CONFIG[ev.status];
                    return (
                      <div key={ev.id}
                        className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium text-sm">{ev.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Iniciada em {formatDate(ev.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/evaluations/${ev.id}`}>Abrir</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
