"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Shield, Users, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  crp: string | null;
  clinicName: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: { patients: number; evaluations: number };
}

export default function AdminPage() {
  const { data: session } = useSession();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.isAdmin) return;

    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else setError("Erro ao carregar usuários.");
      })
      .catch(() => setError("Erro ao conectar com o servidor."))
      .finally(() => setLoading(false));
  }, [session]);

  async function handleDelete(userId: string) {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setConfirmDelete(null);
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao excluir usuário.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAdmin(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH" });
      if (res.ok) {
        const updated: { id: string; isAdmin: boolean } = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? { ...u, isAdmin: updated.isAdmin } : u)),
        );
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao alterar papel do usuário.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    }
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Acesso negado</h1>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
        <Button variant="outline" onClick={() => history.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  const totalAdmins = users.filter((u) => u.isAdmin).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-500 shrink-0" />
        <div>
          <h1 className="text-xl font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento de usuários da plataforma
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            className="text-destructive/70 hover:text-destructive text-xs underline shrink-0"
            onClick={() => setError(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{totalAdmins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usuários</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="divide-y">
              {users.map((user) => {
                const isCurrentUser = user.id === session.user?.id;
                const displayName = user.name ?? user.email ?? "Sem nome";

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 py-4 flex-wrap"
                  >
                    {/* Avatar + info */}
                    <Avatar name={displayName} size="md" className="shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{displayName}</span>
                        {user.isAdmin ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            Usuário
                          </Badge>
                        )}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            Você
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>

                      {(user.crp || user.clinicName) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[user.crp, user.clinicName].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {user._count.patients} pacientes · {user._count.evaluations} avaliações
                        {" · "}membro desde{" "}
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    {/* Actions */}
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => handleToggleAdmin(user.id)}
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {user.isAdmin ? "Remover Admin" : "Tornar Admin"}
                        </Button>

                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-destructive font-medium">
                              Confirmar exclusão?
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.id)}
                              disabled={deletingId === user.id}
                            >
                              {deletingId === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Sim, excluir"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDelete(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive border-destructive/30 h-7 text-xs px-2.5"
                            onClick={() => setConfirmDelete(user.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
