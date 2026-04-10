export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  items: z.array(z.number().int().min(0).max(3)).length(21),
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

    const totalScore = items.reduce((s, v) => s + v, 0);

    function classify(s: number): string {
      if (s <= 13) return "Mínimo";
      if (s <= 19) return "Leve";
      if (s <= 28) return "Moderado";
      return "Grave";
    }

    const classification = classify(totalScore);

    const saved = await prisma.testBdi2.upsert({
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
        item19: items[18],
        item20: items[19],
        item21: items[20],
        totalScore,
        classification,
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
        item19: items[18],
        item20: items[19],
        item21: items[20],
        totalScore,
        classification,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/bdi2]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
