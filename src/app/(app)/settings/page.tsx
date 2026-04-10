"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) { setDeleteError("Erro ao excluir conta. Tente novamente."); setDeleting(false); return; }
      await signOut({ callbackUrl: "/login" });
    } catch {
      setDeleteError("Erro de conexão. Tente novamente.");
      setDeleting(false);
    }
  }

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
        <CardContent className="flex items-center gap-4 sm:gap-5 p-4 sm:p-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Salvo com sucesso!
            </span>
          )}
          <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
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

      {/* ── Zona de Perigo ─────────────────────────────────────────────── */}
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-destructive" />
            <CardTitle className="text-base text-destructive">Zona de Perigo</CardTitle>
          </div>
          <CardDescription>
            Ações irreversíveis. Todos os seus pacientes, avaliações e laudos serão permanentemente excluídos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmDelete ? (
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir minha conta
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">
                Tem certeza? Esta ação não pode ser desfeita. Todos os seus dados serão apagados permanentemente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto"
                >
                  {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Excluindo...</> : "Sim, excluir minha conta"}
                </Button>
                <Button
                  variant="outline"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
