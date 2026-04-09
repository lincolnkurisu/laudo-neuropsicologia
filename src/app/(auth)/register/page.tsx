"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve conter ao menos um número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(
        res.status === 409
          ? "Este email já está cadastrado. Faça login."
          : body?.error ?? "Erro ao criar conta. Tente novamente."
      );
      return;
    }

    router.push("/login?registered=1");
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl text-white">Criar sua conta</CardTitle>
        <CardDescription className="text-slate-400">
          Preencha os dados para começar a usar o NeuroPsi
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {serverError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20
                          px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Nome completo</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Dr. João da Silva"
              className="bg-white/10 border-white/10 text-white placeholder:text-slate-500
                         focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="seu@email.com"
              className="bg-white/10 border-white/10 text-white placeholder:text-slate-500
                         focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Senha</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
              className="bg-white/10 border-white/10 text-white placeholder:text-slate-500
                         focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Confirmar senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="Repita a senha"
              className="bg-white/10 border-white/10 text-white placeholder:text-slate-500
                         focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando conta...
              </>
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Já tem conta?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
