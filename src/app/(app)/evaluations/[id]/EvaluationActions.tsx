"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteTestButtonProps {
  evaluationId: string;
  testKey: string;
  testLabel: string;
}

export function DeleteTestButton({ evaluationId, testKey, testLabel }: DeleteTestButtonProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluations/${evaluationId}/tests/clear`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testKey }),
      });
      if (res.ok) {
        setConfirm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-destructive font-medium">Remover {testLabel}?</span>
        <Button
          size="sm"
          variant="destructive"
          className="h-6 text-[10px] px-2"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "..." : "Sim"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-1.5"
          onClick={() => setConfirm(false)}
          disabled={loading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 text-[10px] px-2 text-muted-foreground hover:text-destructive"
      onClick={() => setConfirm(true)}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}

// ─── Delete Evaluation ────────────────────────────────────────────────────────

interface DeleteEvaluationButtonProps {
  evaluationId: string;
  patientId: string;
}

export function DeleteEvaluationButton({ evaluationId, patientId }: DeleteEvaluationButtonProps) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "warn" | "loading">("idle");

  const handleDelete = async () => {
    setStep("loading");
    try {
      const res = await fetch(`/api/evaluations/${evaluationId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/patients/${patientId}`);
      } else {
        setStep("warn");
      }
    } catch {
      setStep("warn");
    }
  };

  if (step === "idle") {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5" onClick={() => setStep("warn")}>
        <Trash2 className="h-4 w-4" />
        Excluir Avaliação
      </Button>
    );
  }

  if (step === "loading") {
    return <Button variant="ghost" size="sm" disabled>Excluindo...</Button>;
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-destructive">Excluir esta avaliação?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Todos os testes registrados serão permanentemente removidos.{" "}
            <span className="font-medium text-foreground">
              A Resolução CFP nº 06/2019 estabelece que prontuários devem ser mantidos por no mínimo 5 anos.
            </span>{" "}
            Ao excluir, você assume a responsabilidade pela conformidade legal.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Confirmar Exclusão
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStep("idle")}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
