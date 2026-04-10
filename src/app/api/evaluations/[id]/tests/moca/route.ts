export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  visuospatial:   z.number().int().min(0).max(5),
  naming:         z.number().int().min(0).max(3),
  attention:      z.number().int().min(0).max(6),
  language:       z.number().int().min(0).max(3),
  abstraction:    z.number().int().min(0).max(2),
  recall:         z.number().int().min(0).max(5),
  orientation:    z.number().int().min(0).max(6),
  educationBonus: z.boolean(),
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
      visuospatial,
      naming,
      attention,
      language,
      abstraction,
      recall,
      orientation,
      educationBonus,
    } = parsed.data;

    const totalScore =
      visuospatial + naming + attention + language + abstraction + recall + orientation;
    const adjustedScore = Math.min(30, educationBonus ? totalScore + 1 : totalScore);

    function classify(s: number): string {
      if (s >= 26) return "Normal";
      if (s >= 18) return "Comprometimento Cognitivo Leve";
      if (s >= 10) return "Comprometimento Moderado";
      return "Comprometimento Grave";
    }

    const classification = classify(adjustedScore);

    const saved = await prisma.testMoca.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        visuospatial,
        naming,
        attention,
        language,
        abstraction,
        recall,
        orientation,
        educationBonus,
        totalScore,
        adjustedScore,
        classification,
      },
      update: {
        visuospatial,
        naming,
        attention,
        language,
        abstraction,
        recall,
        orientation,
        educationBonus,
        totalScore,
        adjustedScore,
        classification,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/moca]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
