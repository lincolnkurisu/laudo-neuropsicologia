export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  detectionScore:    z.number().int().min(0).max(10),
  understandingScore: z.number().int().min(0).max(10),
  empathyScore:      z.number().int().min(0).max(10),
  controlScore:      z.number().int().min(0).max(10),
});

function classifyFauxPas(total: number): string {
  if (total >= 35) return "Normal / Superior";
  if (total >= 28) return "Médio";
  if (total >= 20) return "Médio-Inferior";
  return "Rebaixado — Comprometimento de Teoria da Mente";
}

function interpret(
  detection: number, understanding: number, empathy: number,
  control: number, total: number, index: number, classification: string,
): string {
  const parts: string[] = [];

  parts.push(
    `Escore Total: ${total}/40 (${classification}). ` +
    `Índice de Teoria da Mente: ${index.toFixed(1)}%.`
  );

  parts.push(
    `Detecção de Faux Pas: ${detection}/10. ` +
    `Compreensão: ${understanding}/10. ` +
    `Empatia: ${empathy}/10.`
  );

  parts.push(
    `Histórias Controle: ${control}/10` +
    (control < 8 ? " — atenção para possível dificuldade de compreensão das histórias." : ".")
  );

  if (index < 60) {
    parts.push(
      "Desempenho sugestivo de comprometimento na cognição social e Teoria da Mente (ToM). " +
      "Avaliar no contexto clínico: TEA, lesões frontais, demências frontotemporais."
    );
  } else if (index < 80) {
    parts.push("Cognição social levemente comprometida. Monitorar no contexto clínico.");
  } else {
    parts.push("Cognição social e Teoria da Mente dentro do esperado.");
  }

  return parts.join(" ");
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: evaluationId } = await params;

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: evaluationId, userId: session.user.id },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { detectionScore, understandingScore, empathyScore, controlScore } = parsed.data;

    const totalScore   = detectionScore + understandingScore + empathyScore + controlScore;
    const fauxPasIndex = Math.round(((detectionScore + understandingScore + empathyScore) / 30) * 1000) / 10;
    const classification = classifyFauxPas(totalScore);
    const interpretation = interpret(
      detectionScore, understandingScore, empathyScore,
      controlScore, totalScore, fauxPasIndex, classification,
    );

    const data = {
      detectionScore, understandingScore, empathyScore, controlScore,
      totalScore, fauxPasIndex, classification, interpretation,
    };

    const saved = await prisma.testFauxPas.upsert({
      where:  { evaluationId },
      create: { evaluationId, ...data },
      update: data,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/fauxpas]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erro interno", detail: message }, { status: 500 });
  }
}
