export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  vocabularioT:     z.number().int().min(20).max(80),
  cubosT:           z.number().int().min(20).max(80),
  semelhancasT:     z.number().int().min(20).max(80),
  raciocMatricialT: z.number().int().min(20).max(80),
});

function clampQI(value: number): number {
  return Math.min(160, Math.max(40, value));
}

function classifyQI(qi: number): string {
  if (qi >= 130) return "Muito Superior";
  if (qi >= 120) return "Superior";
  if (qi >= 110) return "Médio-Superior";
  if (qi >= 90)  return "Médio";
  if (qi >= 80)  return "Médio-Inferior";
  if (qi >= 70)  return "Limítrofe";
  return "Deficiência Intelectual";
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

    const { vocabularioT, cubosT, semelhancasT, raciocMatricialT } = parsed.data;

    const sumVerbal    = vocabularioT + semelhancasT;
    const sumExecucao  = cubosT + raciocMatricialT;
    const sumTotal     = vocabularioT + cubosT + semelhancasT + raciocMatricialT;

    const qiVerbal    = clampQI(Math.round(100 + 15 * (sumVerbal - 100) / 14.14));
    const qiExecucao  = clampQI(Math.round(100 + 15 * (sumExecucao - 100) / 14.14));
    const qiTotal     = clampQI(Math.round(100 + 15 * (sumTotal - 200) / 20));

    const qiVerbalClassification   = classifyQI(qiVerbal);
    const qiExecucaoClassification = classifyQI(qiExecucao);
    const qiTotalClassification    = classifyQI(qiTotal);

    const saved = await prisma.testWasi.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        // Store T scores in the PB fields (psychologist provides T scores directly)
        vocabularioPB:     vocabularioT,
        cubosPB:           cubosT,
        semelhancasPB:     semelhancasT,
        raciocMatricialPB: raciocMatricialT,
        // Also store as T score fields
        vocabularioT,
        cubosT,
        semelhancasT,
        raciocMatricialT,
        qiVerbal,
        qiExecucao,
        qiTotal,
        qiVerbalClassification,
        qiExecucaoClassification,
        qiTotalClassification,
      },
      update: {
        vocabularioPB:     vocabularioT,
        cubosPB:           cubosT,
        semelhancasPB:     semelhancasT,
        raciocMatricialPB: raciocMatricialT,
        vocabularioT,
        cubosT,
        semelhancasT,
        raciocMatricialT,
        qiVerbal,
        qiExecucao,
        qiTotal,
        qiVerbalClassification,
        qiExecucaoClassification,
        qiTotalClassification,
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
    console.error("[POST /api/evaluations/[id]/tests/wasi]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
