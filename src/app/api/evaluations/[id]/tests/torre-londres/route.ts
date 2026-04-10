export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  totalProblems:       z.number().int().min(1),
  correctSolutions:    z.number().int().min(0),
  ruleViolations:      z.number().int().min(0),
  totalMoves:          z.number().int().min(0),
  meanInitiationTime:  z.number().min(0),
  meanExecutionTime:   z.number().min(0),
  totalTime:           z.number().min(0),
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
      totalProblems,
      correctSolutions,
      ruleViolations,
      totalMoves,
      meanInitiationTime,
      meanExecutionTime,
      totalTime,
    } = parsed.data;

    const accuracyPct =
      Math.round((correctSolutions / totalProblems) * 100 * 10) / 10;

    function classifyAccuracy(pct: number): string {
      if (pct >= 80) return "Superior";
      if (pct >= 65) return "Médio-Superior";
      if (pct >= 50) return "Médio";
      if (pct >= 35) return "Médio-Inferior";
      return "Rebaixado";
    }

    function classifyInitiationTime(t: number): string {
      if (t <= 5)  return "Superior";
      if (t <= 10) return "Médio";
      if (t <= 20) return "Médio-Inferior";
      return "Rebaixado";
    }

    const totalScoreClass = classifyAccuracy(accuracyPct);
    const executionClass  = classifyInitiationTime(meanInitiationTime);

    let interpretation: string;
    if (accuracyPct >= 80 && ruleViolations === 0 && meanInitiationTime <= 10) {
      interpretation = "Planejamento e resolução de problemas dentro do esperado";
    } else if (accuracyPct >= 65 || ruleViolations <= 2) {
      interpretation = "Dificuldades leves de planejamento";
    } else if (accuracyPct < 50 || ruleViolations > 5) {
      interpretation = "Déficit significativo de planejamento e funções executivas";
    } else {
      interpretation = "Planejamento moderadamente comprometido";
    }

    const saved = await prisma.testTorreLondres.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        totalProblems,
        correctSolutions,
        ruleViolations,
        totalMoves,
        meanInitiationTime,
        meanExecutionTime,
        totalTime,
        accuracyPct,
        totalScoreClass,
        executionClass,
        interpretation,
      },
      update: {
        totalProblems,
        correctSolutions,
        ruleViolations,
        totalMoves,
        meanInitiationTime,
        meanExecutionTime,
        totalTime,
        accuracyPct,
        totalScoreClass,
        executionClass,
        interpretation,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/torre-londres]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
