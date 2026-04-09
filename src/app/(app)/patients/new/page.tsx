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
import { EDUCATION_OPTIONS, EDUCATION_VALUES, GENDER_OPTIONS, GENDER_VALUES } from "@/lib/constants";
import { calculateAge } from "@/lib/utils";

// ─── Validação de CPF (dígitos verificadores) ─────────────────────────────────

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  const calc = (mod: number) => {
    let sum = 0;
    for (let i = 0; i < mod - 1; i++) {
      sum += parseInt(digits[i]) * (mod - i);
    }
    const rest = (sum * 10) % 11;
    return rest >= 10 ? 0 : rest;
  };

  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10]);
}

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const patientSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nome deve ter ao menos 3 caracteres")
    .max(120, "Nome muito longo"),
  dateOfBirth: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((d) => !isNaN(new Date(d).getTime()), "Data inválida")
    .refine((d) => new Date(d) < new Date(), "Data de nascimento não pode ser no futuro")
    .refine((d) => {
      const age = calculateAge(new Date(d));
      return age >= 13 && age <= 120;
    }, "Idade deve estar entre 13 e 120 anos"),
  gender: z.enum(GENDER_VALUES),
  educationLevel: z.enum(EDUCATION_VALUES),
  occupation: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^(\(?\d{2}\)?\s?)?(\d{4,5}[-\s]?\d{4})$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  cpf: z
    .string()
    .refine(
      (v) => v === "" || isValidCPF(v),
      "CPF inválido. Verifique os dígitos verificadores."
    )
    .optional()
    .or(z.literal("")),
});

type PatientFormData = z.infer<typeof patientSchema>;

// ─── Componente ───────────────────────────────────────────────────────────────

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
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        res.status === 409
          ? "CPF já cadastrado para outro paciente."
          : body?.error ?? "Erro ao salvar. Verifique os dados e tente novamente.";
      alert(msg);
      return;
    }

    const patient = await res.json();
    router.push(`/patients/${patient.id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">Preencha os dados cadastrais do paciente.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Dados pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            <CardDescription>
              Informações demográficas fundamentais para a normatização dos testes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder="Ex: Maria da Silva Souza"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-destructive" role="alert">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data de nascimento */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de nascimento *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  max={new Date().toISOString().split("T")[0]}
                  aria-invalid={!!errors.dateOfBirth}
                  aria-describedby={errors.dateOfBirth ? "dob-error" : undefined}
                />
                {errors.dateOfBirth && (
                  <p id="dob-error" className="text-sm text-destructive" role="alert">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero *</Label>
                <Select onValueChange={(v) => setValue("gender", v as PatientFormData["gender"], { shouldValidate: true })}>
                  <SelectTrigger id="gender" aria-invalid={!!errors.gender}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive" role="alert">
                    Selecione o gênero
                  </p>
                )}
              </div>
            </div>

            {/* Escolaridade */}
            <div className="space-y-2">
              <Label htmlFor="educationLevel">Nível de escolaridade *</Label>
              <Select onValueChange={(v) => setValue("educationLevel", v as PatientFormData["educationLevel"], { shouldValidate: true })}>
                <SelectTrigger id="educationLevel" aria-invalid={!!errors.educationLevel}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.educationLevel && (
                <p className="text-sm text-destructive" role="alert">
                  Selecione o nível de escolaridade
                </p>
              )}
            </div>

            {/* Ocupação */}
            <div className="space-y-2">
              <Label htmlFor="occupation">Ocupação</Label>
              <Input
                id="occupation"
                {...register("occupation")}
                placeholder="Ex: Professor, Estudante, Aposentado..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="(11) 99999-9999"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="paciente@email.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register("cpf")}
                placeholder="000.000.000-00"
                aria-invalid={!!errors.cpf}
                aria-describedby={errors.cpf ? "cpf-error" : undefined}
              />
              {errors.cpf && (
                <p id="cpf-error" className="text-sm text-destructive" role="alert">
                  {errors.cpf.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
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
