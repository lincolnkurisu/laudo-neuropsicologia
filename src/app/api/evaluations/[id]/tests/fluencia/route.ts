export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  fasF:    z.number().int().min(0),
  fasA:    z.number().int().min(0),
  fasS:    z.number().int().min(0),
  animais: z.number().int().min(0),
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

    const { fasF, fasA, fasS, animais } = parsed.data;

    const fasTotal = fasF + fasA + fasS;

    function classifyFas(total: number): string {
      if (total >= 45) return "Superior";
      if (total >= 36) return "Médio-Superior";
      if (total >= 27) return "Médio";
      if (total >= 18) return "Médio-Inferior";
      return "Rebaixado";
    }

    function classifyAnimais(n: number): string {
      if (n >= 22) return "Superior";
      if (n >= 17) return "Médio-Superior";
      if (n >= 13) return "Médio";
      if (n >= 9)  return "Médio-Inferior";
      return "Rebaixado";
    }

    const fasClassification     = classifyFas(fasTotal);
    const animaisClassification = classifyAnimais(animais);

    const saved = await prisma.testFluencia.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        fasF,
        fasA,
        fasS,
        fasTotal,
        animais,
        fasClassification,
        animaisClassification,
      },
      update: {
        fasF,
        fasA,
        fasS,
        fasTotal,
        animais,
        fasClassification,
        animaisClassification,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/fluencia]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
