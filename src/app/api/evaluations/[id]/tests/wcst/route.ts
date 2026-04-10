export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  totalTrials:               z.number().int().min(1).max(128),
  totalCorrect:              z.number().int().min(0),
  totalErrors:               z.number().int().min(0),
  perseverativeResponses:    z.number().int().min(0),
  perseverativeErrors:       z.number().int().min(0),
  nonPerseverativeErrors:    z.number().int().min(0),
  conceptualLevelResponses:  z.number().int().min(0),
  categoriesCompleted:       z.number().int().min(0).max(6),
  trialsFirstCategory:       z.number().int().min(0).optional(),
  failureMaintainSet:        z.number().int().min(0),
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

    const {
      totalTrials,
      totalCorrect,
      totalErrors,
      perseverativeResponses,
      perseverativeErrors,
      nonPerseverativeErrors,
      conceptualLevelResponses,
      categoriesCompleted,
      trialsFirstCategory,
      failureMaintainSet,
    } = parsed.data;

    const perseverativeErrorsPct =
      Math.round((perseverativeErrors / totalTrials) * 100 * 10) / 10;
    const conceptualLevelPct =
      Math.round((conceptualLevelResponses / totalTrials) * 100 * 10) / 10;
    const totalErrorsPct =
      Math.round((totalErrors / totalTrials) * 100 * 10) / 10;

    function classifyCategories(n: number): string {
      if (n === 6) return "Superior";
      if (n >= 5)  return "Médio-Superior";
      if (n >= 4)  return "Médio";
      if (n >= 2)  return "Médio-Inferior";
      return "Rebaixado";
    }

    function classifyPerseverative(pct: number): string {
      if (pct <= 10) return "Superior";
      if (pct <= 16) return "Médio";
      if (pct <= 20) return "Médio-Inferior";
      return "Rebaixado";
    }

    function classifyErrors(pct: number): string {
      if (pct <= 15) return "Superior";
      if (pct <= 25) return "Médio";
      if (pct <= 35) return "Médio-Inferior";
      return "Rebaixado";
    }

    const categoriesClass    = classifyCategories(categoriesCompleted);
    const perseverativeClass = classifyPerseverative(perseverativeErrorsPct);
    const errorsClass        = classifyErrors(totalErrorsPct);

    let interpretation: string;
    if (categoriesCompleted === 6 && perseverativeErrorsPct <= 10) {
      interpretation = "Flexibilidade cognitiva dentro do esperado";
    } else if (categoriesCompleted >= 4 || perseverativeErrorsPct <= 20) {
      interpretation = "Flexibilidade cognitiva levemente comprometida";
    } else if (categoriesCompleted <= 2 || perseverativeErrorsPct > 30) {
      interpretation =
        "Déficit significativo de flexibilidade cognitiva e controle perseverativo";
    } else {
      interpretation = "Flexibilidade cognitiva moderadamente comprometida";
    }

    const saved = await prisma.testWcst.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        totalTrials,
        totalCorrect,
        totalErrors,
        perseverativeResponses,
        perseverativeErrors,
        nonPerseverativeErrors,
        conceptualLevelResponses,
        categoriesCompleted,
        trialsFirstCategory,
        failureMaintainSet,
        perseverativeErrorsPct,
        conceptualLevelPct,
        perseverativeClass,
        categoriesClass,
        errorsClass,
        interpretation,
      },
      update: {
        totalTrials,
        totalCorrect,
        totalErrors,
        perseverativeResponses,
        perseverativeErrors,
        nonPerseverativeErrors,
        conceptualLevelResponses,
        categoriesCompleted,
        trialsFirstCategory,
        failureMaintainSet,
        perseverativeErrorsPct,
        conceptualLevelPct,
        perseverativeClass,
        categoriesClass,
        errorsClass,
        interpretation,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/wcst]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
