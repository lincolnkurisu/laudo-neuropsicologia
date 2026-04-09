export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scoreBpa2 } from "@/services/scoring/bpa2";
import { calculateAge } from "@/lib/utils";

const bodySchema = z.object({
  concentradaAcertos: z.number().int().min(0).max(120),
  concentradaErros:   z.number().int().min(0).max(120),
  divididaAcertos:    z.number().int().min(0).max(120),
  divididaErros:      z.number().int().min(0).max(120),
  alternadaAcertos:   z.number().int().min(0).max(120),
  alternadaErros:     z.number().int().min(0).max(120),
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
      include: {
        patient: { select: { dateOfBirth: true, educationLevel: true } },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const age = calculateAge(evaluation.patient.dateOfBirth);
    const educationLevel = evaluation.patient.educationLevel;

    const result = scoreBpa2({ ...parsed.data, age, educationLevel });

    const {
      concentradaPB,
      divididaPB,
      alternadaPB,
      concentradaPercentile,
      divididaPercentile,
      alternadaPercentile,
      concentradaClassification,
      divididaClassification,
      alternadaClassification,
    } = result.scores;

    const saved = await prisma.testBpa2.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        concentradaAcertos: parsed.data.concentradaAcertos,
        concentradaErros:   parsed.data.concentradaErros,
        divididaAcertos:    parsed.data.divididaAcertos,
        divididaErros:      parsed.data.divididaErros,
        alternadaAcertos:   parsed.data.alternadaAcertos,
        alternadaErros:     parsed.data.alternadaErros,
        concentradaPB,
        divididaPB,
        alternadaPB,
        concentradaPercentile,
        divididaPercentile,
        alternadaPercentile,
        concentradaClassification,
        divididaClassification,
        alternadaClassification,
      },
      update: {
        concentradaAcertos: parsed.data.concentradaAcertos,
        concentradaErros:   parsed.data.concentradaErros,
        divididaAcertos:    parsed.data.divididaAcertos,
        divididaErros:      parsed.data.divididaErros,
        alternadaAcertos:   parsed.data.alternadaAcertos,
        alternadaErros:     parsed.data.alternadaErros,
        concentradaPB,
        divididaPB,
        alternadaPB,
        concentradaPercentile,
        divididaPercentile,
        alternadaPercentile,
        concentradaClassification,
        divididaClassification,
        alternadaClassification,
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
    console.error("[POST /api/evaluations/[id]/tests/bpa2]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
