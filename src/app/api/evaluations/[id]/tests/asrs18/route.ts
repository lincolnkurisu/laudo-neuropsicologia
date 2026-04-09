export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scoreAsrs18 } from "@/services/scoring/asrs18";

const bodySchema = z.object({
  items: z
    .array(z.number().int().min(0).max(4))
    .length(18, "Exatamente 18 itens são necessários"),
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

    const { items } = parsed.data;

    const result = scoreAsrs18({
      items: items as [
        number, number, number, number, number, number,
        number, number, number, number, number, number,
        number, number, number, number, number, number,
      ],
    });

    const {
      scorePartA,
      scorePartB,
      totalScore,
      partAPositiveItems,
      partBPositiveItems,
      clinicalSignificant,
      interpretation,
    } = result.scores;

    const saved = await prisma.testAsrs18.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        item1:  items[0],
        item2:  items[1],
        item3:  items[2],
        item4:  items[3],
        item5:  items[4],
        item6:  items[5],
        item7:  items[6],
        item8:  items[7],
        item9:  items[8],
        item10: items[9],
        item11: items[10],
        item12: items[11],
        item13: items[12],
        item14: items[13],
        item15: items[14],
        item16: items[15],
        item17: items[16],
        item18: items[17],
        scorePartA,
        scorePartB,
        totalScore,
        partAPositiveItems,
        partBPositiveItems,
        clinicalSignificant,
        interpretation,
      },
      update: {
        item1:  items[0],
        item2:  items[1],
        item3:  items[2],
        item4:  items[3],
        item5:  items[4],
        item6:  items[5],
        item7:  items[6],
        item8:  items[7],
        item9:  items[8],
        item10: items[9],
        item11: items[10],
        item12: items[11],
        item13: items[12],
        item14: items[13],
        item15: items[14],
        item16: items[15],
        item17: items[16],
        item18: items[17],
        scorePartA,
        scorePartB,
        totalScore,
        partAPositiveItems,
        partBPositiveItems,
        clinicalSignificant,
        interpretation,
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
    console.error("[POST /api/evaluations/[id]/tests/asrs18]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
