export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scoreRavlt } from "@/services/scoring/ravlt";
import { calculateAge } from "@/lib/utils";

const bodySchema = z.object({
  trialA1:          z.number().int().min(0).max(15),
  trialA2:          z.number().int().min(0).max(15),
  trialA3:          z.number().int().min(0).max(15),
  trialA4:          z.number().int().min(0).max(15),
  trialA5:          z.number().int().min(0).max(15),
  trialB1:          z.number().int().min(0).max(15),
  recallShort:      z.number().int().min(0).max(15),
  recallLong:       z.number().int().min(0).max(15),
  recognitionHits:  z.number().int().min(0).max(15).nullable().optional(),
  recognitionFP:    z.number().int().min(0).max(15).nullable().optional(),
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

    // Verify ownership and get patient for age calculation
    const evaluation = await prisma.evaluation.findFirst({
      where: { id: evaluationId, userId: session.user.id },
      include: {
        patient: { select: { dateOfBirth: true } },
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

    const result = scoreRavlt({ ...parsed.data, age });

    const {
      totalLearning,
      learningSlope,
      proactiveInhibition,
      retroactiveInhibition,
      savingsShortPct,
      savingsLongPct,
      recognitionIndex,
      percentileTotalLearning,
      percentileRecallShort,
      percentileRecallLong,
      percentileRecognition,
      classificationLearning,
      classificationRecallShort,
      classificationRecallLong,
      interpretation,
    } = result.scores;

    const saved = await prisma.testRavlt.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        trialA1:         parsed.data.trialA1,
        trialA2:         parsed.data.trialA2,
        trialA3:         parsed.data.trialA3,
        trialA4:         parsed.data.trialA4,
        trialA5:         parsed.data.trialA5,
        trialB1:         parsed.data.trialB1,
        recallShort:     parsed.data.recallShort,
        recallLong:      parsed.data.recallLong,
        recognitionHits: parsed.data.recognitionHits ?? null,
        recognitionFP:   parsed.data.recognitionFP ?? null,
        totalLearning,
        learningSlope,
        proactiveInhibition,
        retroactiveInhibition,
        savingsShortPct,
        savingsLongPct,
        recognitionIndex,
        percentileTotalLearning,
        percentileRecallShort,
        percentileRecallLong,
        percentileRecognition,
        classificationLearning,
        classificationRecallShort,
        classificationRecallLong,
        interpretation,
      },
      update: {
        trialA1:         parsed.data.trialA1,
        trialA2:         parsed.data.trialA2,
        trialA3:         parsed.data.trialA3,
        trialA4:         parsed.data.trialA4,
        trialA5:         parsed.data.trialA5,
        trialB1:         parsed.data.trialB1,
        recallShort:     parsed.data.recallShort,
        recallLong:      parsed.data.recallLong,
        recognitionHits: parsed.data.recognitionHits ?? null,
        recognitionFP:   parsed.data.recognitionFP ?? null,
        totalLearning,
        learningSlope,
        proactiveInhibition,
        retroactiveInhibition,
        savingsShortPct,
        savingsLongPct,
        recognitionIndex,
        percentileTotalLearning,
        percentileRecallShort,
        percentileRecallLong,
        percentileRecognition,
        classificationLearning,
        classificationRecallShort,
        classificationRecallLong,
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
    console.error("[POST /api/evaluations/[id]/tests/ravlt]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erro interno", detail: message }, { status: 500 });
  }
}
