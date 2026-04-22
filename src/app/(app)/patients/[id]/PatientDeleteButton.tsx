"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { patientId: string }

export function PatientDeleteButton({ patientId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "warn" | "loading">("idle");
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setStep("loading");
    setError("");
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/patients");
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao excluir.");
        setStep("warn");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStep("warn");
    }
  };

  if (step === "idle") {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5 w-full sm:w-auto" onClick={() => setStep("warn")}>
        <Trash2 className="h-4 w-4" />
        Excluir Paciente
      </Button>
    );
  }

  if (step === "loading") {
    return <Button variant="ghost" size="sm" disabled className="w-full sm:w-auto">Excluindo...</Button>;
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3 mt-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-destructive">Excluir este paciente?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Todas as anamneses, avaliações e testes deste paciente serão{" "}
            <strong className="text-foreground">permanentemente removidos</strong>.
          </p>
          <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠ Resolução CFP nº 06/2019: prontuários devem ser mantidos por no mínimo 5 anos. Ao excluir, você assume a responsabilidade pela conformidade legal.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
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
