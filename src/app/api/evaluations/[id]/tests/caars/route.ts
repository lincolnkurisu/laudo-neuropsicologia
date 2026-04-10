export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  inattentionT:      z.number().int().min(0).max(100),
  hyperactivityT:    z.number().int().min(0).max(100),
  impulsivityT:      z.number().int().min(0).max(100),
  selfConceptT:      z.number().int().min(0).max(100),
  dsmInattentionT:   z.number().int().min(0).max(100),
  dsmHyperactivityT: z.number().int().min(0).max(100),
  adhdIndexT:        z.number().int().min(0).max(100),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

function classifyCaars(t: number): string {
  if (t >= 70) return "Marcadamente Atípico";
  if (t >= 65) return "Significativamente Atípico";
  if (t >= 60) return "Levemente Atípico";
  return "Dentro do Esperado";
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
      inattentionT,
      hyperactivityT,
      impulsivityT,
      selfConceptT,
      dsmInattentionT,
      dsmHyperactivityT,
      adhdIndexT,
    } = parsed.data;

    const inattentionClass      = classifyCaars(inattentionT);
    const hyperactivityClass    = classifyCaars(hyperactivityT);
    const impulsivityClass      = classifyCaars(impulsivityT);
    const selfConceptClass      = classifyCaars(selfConceptT);
    const dsmInattentionClass   = classifyCaars(dsmInattentionT);
    const dsmHyperactivityClass = classifyCaars(dsmHyperactivityT);
    const adhdIndexClass        = classifyCaars(adhdIndexT);

    let interpretation: string;
    if (adhdIndexT >= 70) {
      interpretation = "Alta probabilidade de TDAH";
    } else if (adhdIndexT >= 65) {
      interpretation = "Probabilidade moderada de TDAH — avaliar com outros instrumentos";
    } else if (adhdIndexT >= 60) {
      interpretation = "Sugere dificuldades atencionais";
    } else {
      interpretation = "Sem evidências de TDAH";
    }

    const fields = {
      inattentionT,
      hyperactivityT,
      impulsivityT,
      selfConceptT,
      dsmInattentionT,
      dsmHyperactivityT,
      adhdIndexT,
      inattentionClass,
      hyperactivityClass,
      impulsivityClass,
      selfConceptClass,
      dsmInattentionClass,
      dsmHyperactivityClass,
      adhdIndexClass,
      interpretation,
    };

    const saved = await prisma.testCaars.upsert({
      where: { evaluationId },
      create: { evaluationId, ...fields },
      update: fields,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/caars]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
