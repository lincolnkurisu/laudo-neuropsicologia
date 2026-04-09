export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  leituraTime:       z.number().positive(),
  leituraErrors:     z.number().int().min(0),
  contagemTime:      z.number().positive(),
  contagemErrors:    z.number().int().min(0),
  escolhaTime:       z.number().positive(),
  escolhaErrors:     z.number().int().min(0),
  alternanciaTime:   z.number().positive(),
  alternanciaErrors: z.number().int().min(0),
});

function classifyFdtScore(score: number): string {
  if (score < 1.5) return "Adequado";
  if (score <= 2.0) return "Limítrofe";
  return "Alterado";
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

    const {
      leituraTime, leituraErrors,
      contagemTime, contagemErrors,
      escolhaTime, escolhaErrors,
      alternanciaTime, alternanciaErrors,
    } = parsed.data;

    const baseline = (leituraTime + contagemTime) / 2;

    // Clamp to avoid extreme outliers (0.5 – 10.0 range)
    const inhibitionScore  = Math.min(10, Math.max(0.5, escolhaTime / baseline));
    const flexibilityScore = Math.min(10, Math.max(0.5, alternanciaTime / baseline));

    const inhibitionClassification  = classifyFdtScore(inhibitionScore);
    const flexibilityClassification = classifyFdtScore(flexibilityScore);

    const saved = await prisma.testFdt.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        leituraTime,
        leituraErrors,
        contagemTime,
        contagemErrors,
        escolhaTime,
        escolhaErrors,
        alternanciaTime,
        alternanciaErrors,
        inhibitionScore,
        flexibilityScore,
        inhibitionClassification,
        flexibilityClassification,
      },
      update: {
        leituraTime,
        leituraErrors,
        contagemTime,
        contagemErrors,
        escolhaTime,
        escolhaErrors,
        alternanciaTime,
        alternanciaErrors,
        inhibitionScore,
        flexibilityScore,
        inhibitionClassification,
        flexibilityClassification,
      },
    });

    // Check if all 6 tests are complete
    const fullEvaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: {
        testAsrs18: { select: { id: true } },
        testBfp:    { select: { id: true } },
        testBpa2:   { select: { id: true } },
        testWasi:   { select: { id: true } },
        testFdt:    { select: { id: true } },
        testRavlt:  { select: { id: true } },
      },
    });

    if (
      fullEvaluation &&
      fullEvaluation.testAsrs18 &&
      fullEvaluation.testBfp &&
      fullEvaluation.testBpa2 &&
      fullEvaluation.testWasi &&
      fullEvaluation.testFdt &&
      fullEvaluation.testRavlt
    ) {
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/fdt]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
