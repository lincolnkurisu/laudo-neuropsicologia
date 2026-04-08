"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const patientSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  dateOfBirth: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  educationLevel: z.enum([
    "NO_FORMAL_EDUCATION", "INCOMPLETE_ELEMENTARY", "COMPLETE_ELEMENTARY",
    "INCOMPLETE_HIGH_SCHOOL", "COMPLETE_HIGH_SCHOOL",
    "INCOMPLETE_HIGHER", "COMPLETE_HIGHER", "POSTGRADUATE",
  ]),
  occupation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao cadastrar paciente");
      const patient = await res.json();
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar. Verifique os dados e tente novamente.");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">Preencha os dados cadastrais do paciente.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            <CardDescription>Informações demográficas fundamentais para a normatização dos testes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input id="fullName" {...register("fullName")} placeholder="Ex: Maria da Silva Souza" />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de nascimento *</Label>
                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Gênero *</Label>
                <Select onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE" | "OTHER")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Masculino</SelectItem>
                    <SelectItem value="FEMALE">Feminino</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nível de escolaridade *</Label>
              <Select onValueChange={(v) => setValue("educationLevel", v as PatientFormData["educationLevel"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_FORMAL_EDUCATION">Sem escolaridade</SelectItem>
                  <SelectItem value="INCOMPLETE_ELEMENTARY">Fundamental incompleto</SelectItem>
                  <SelectItem value="COMPLETE_ELEMENTARY">Fundamental completo</SelectItem>
                  <SelectItem value="INCOMPLETE_HIGH_SCHOOL">Médio incompleto</SelectItem>
                  <SelectItem value="COMPLETE_HIGH_SCHOOL">Médio completo</SelectItem>
                  <SelectItem value="INCOMPLETE_HIGHER">Superior incompleto</SelectItem>
                  <SelectItem value="COMPLETE_HIGHER">Superior completo</SelectItem>
                  <SelectItem value="POSTGRADUATE">Pós-graduação</SelectItem>
                </SelectContent>
              </Select>
              {errors.educationLevel && <p className="text-sm text-destructive">{errors.educationLevel.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Ocupação</Label>
              <Input id="occupation" {...register("occupation")} placeholder="Ex: Professor, Estudante, Aposentado..." />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="paciente@email.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Cadastrar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
