export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  partATime:   z.number().positive(),
  partAErrors: z.number().int().min(0),
  partBTime:   z.number().positive(),
  partBErrors: z.number().int().min(0),
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

    const { partATime, partAErrors, partBTime, partBErrors } = parsed.data;

    const ratio = partBTime / partATime;

    function classifyTmt(seconds: number, part: "A" | "B"): string {
      if (part === "A") {
        if (seconds <= 29)  return "Superior";
        if (seconds <= 45)  return "Médio";
        if (seconds <= 78)  return "Limítrofe";
        return "Rebaixado";
      } else {
        if (seconds <= 58)  return "Superior";
        if (seconds <= 91)  return "Médio";
        if (seconds <= 150) return "Limítrofe";
        return "Rebaixado";
      }
    }

    const partAClassification = classifyTmt(partATime, "A");
    const partBClassification = classifyTmt(partBTime, "B");

    const saved = await prisma.testTmt.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        partATime,
        partAErrors,
        partBTime,
        partBErrors,
        ratio,
        partAClassification,
        partBClassification,
      },
      update: {
        partATime,
        partAErrors,
        partBTime,
        partBErrors,
        ratio,
        partAClassification,
        partBClassification,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/tmt]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
