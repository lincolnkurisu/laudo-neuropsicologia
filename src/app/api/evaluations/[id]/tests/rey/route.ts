export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  copyScore:   z.number().min(0).max(36),
  copyTime:    z.number().positive().optional().nullable(),
  recallScore: z.number().min(0).max(36),
  recallTime:  z.number().positive().optional().nullable(),
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

    const { copyScore, copyTime, recallScore, recallTime } = parsed.data;

    const savings =
      copyScore > 0
        ? Math.round((recallScore / copyScore) * 100 * 10) / 10
        : 0;

    function classifyRey(score: number): string {
      if (score >= 32) return "Superior";
      if (score >= 24) return "Médio-Superior";
      if (score >= 17) return "Médio";
      if (score >= 11) return "Médio-Inferior";
      return "Rebaixado";
    }

    const copyClassification   = classifyRey(copyScore);
    const recallClassification = classifyRey(recallScore);

    const saved = await prisma.testRey.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        copyScore,
        copyTime:            copyTime ?? null,
        recallScore,
        recallTime:          recallTime ?? null,
        savings,
        copyClassification,
        recallClassification,
      },
      update: {
        copyScore,
        copyTime:            copyTime ?? null,
        recallScore,
        recallTime:          recallTime ?? null,
        savings,
        copyClassification,
        recallClassification,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/rey]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
