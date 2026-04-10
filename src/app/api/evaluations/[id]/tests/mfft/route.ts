export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  totalErrors:  z.number().int().min(0),
  meanLatency:  z.number().min(0),
});

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

    const { totalErrors, meanLatency } = parsed.data;

    const impulsivityIndex =
      totalErrors > 0 && meanLatency > 0
        ? Math.round((totalErrors / meanLatency) * 100) / 100
        : 0;

    function classifyMfft(errors: number, latencySeconds: number): string {
      const highErrors    = errors > 20;
      const shortLatency  = latencySeconds < 10;
      if (!highErrors && !shortLatency) return "Reflexivo";
      if (highErrors && shortLatency)   return "Impulsivo";
      if (!highErrors && shortLatency)  return "Rápido-Acurado";
      return "Lento-Inexato";
    }

    const classification = classifyMfft(totalErrors, meanLatency);

    const interpretationMap: Record<string, string> = {
      "Reflexivo":      "Estilo cognitivo reflexivo — responde lentamente com alta precisão",
      "Impulsivo":      "Estilo cognitivo impulsivo — responde rapidamente com muitos erros; indicador de impulsividade",
      "Rápido-Acurado": "Estilo cognitivo eficiente — responde rapidamente com boa precisão",
      "Lento-Inexato":  "Estilo cognitivo lento e inexato — pode indicar dificuldades atencionais ou de processamento",
    };

    const interpretation = interpretationMap[classification];

    const saved = await prisma.testMfft.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        totalErrors,
        meanLatency,
        impulsivityIndex,
        classification,
        interpretation,
      },
      update: {
        totalErrors,
        meanLatency,
        impulsivityIndex,
        classification,
        interpretation,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/mfft]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
