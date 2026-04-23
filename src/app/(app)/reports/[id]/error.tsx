"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div>
        <h2 className="text-xl font-semibold mb-1">Erro ao carregar laudo</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message?.includes("DATABASE_URL")
            ? "Banco de dados não configurado. Verifique as variáveis de ambiente no Vercel."
            : "Não foi possível gerar o laudo. Verifique se os dados da avaliação estão corretos."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mt-1">ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>Tentar novamente</Button>
        <Button asChild variant="default">
          <Link href="/reports">Voltar para Laudos</Link>
        </Button>
      </div>
    </div>
  );
}
