"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2, Loader2 } from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  crp: z.string().optional().or(z.literal("")),
  clinicName: z.string().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const name = watch("name") ?? "";
  const crp = watch("crp") ?? "";

  // Carrega dados atuais ao abrir a página
  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        reset({
          name: data.name ?? "",
          email: data.email ?? "",
          crp: data.crp ?? "",
          clinicName: data.clinicName ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaveError("");
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json();
      reset({
        name: updated.name ?? "",
        email: updated.email ?? "",
        crp: updated.crp ?? "",
        clinicName: updated.clinicName ?? "",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setSaveError("Erro ao salvar. Verifique os dados e tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Preview do perfil */}
      <Card className="border-0 bg-gradient-to-r from-indigo-50 to-violet-50">
        <CardContent className="flex items-center gap-5 p-6">
          <Avatar name={name || "Psicólogo"} size="xl" />
          <div>
            <p className="text-xl font-bold text-foreground">{name || "—"}</p>
            {crp && (
              <p className="text-sm text-muted-foreground font-medium">CRP {crp}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Psicólogo(a) / Neuropsicólogo(a)</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* Dados profissionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Profissionais</CardTitle>
            <CardDescription>
              Essas informações aparecem nos laudos e relatórios gerados pelo sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ex: Dr. João da Silva"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive" role="alert">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="joao@clinica.com.br"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* CRP */}
              <div className="space-y-2">
                <Label htmlFor="crp">CRP</Label>
                <Input
                  id="crp"
                  {...register("crp")}
                  placeholder="06/123456"
                />
                <p className="text-xs text-muted-foreground">
                  Número do Conselho Regional de Psicologia
                </p>
              </div>

              {/* Clínica */}
              <div className="space-y-2">
                <Label htmlFor="clinicName">Nome da clínica</Label>
                <Input
                  id="clinicName"
                  {...register("clinicName")}
                  placeholder="Clínica NeuroPsi"
                />
                <p className="text-xs text-muted-foreground">
                  Aparece no cabeçalho dos laudos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback e botão */}
        <div className="flex items-center justify-end gap-3">
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Salvo com sucesso!
            </span>
          )}
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
