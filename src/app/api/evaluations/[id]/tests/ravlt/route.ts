export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  trialA1:         z.number().int().min(0).max(15),
  trialA2:         z.number().int().min(0).max(15),
  trialA3:         z.number().int().min(0).max(15),
  trialA4:         z.number().int().min(0).max(15),
  trialA5:         z.number().int().min(0).max(15),
  trialB1:         z.number().int().min(0).max(15),
  recallShort:     z.number().int().min(0).max(15),
  recallLong:      z.number().int().min(0).max(15),
  recognitionHits: z.number().int().min(0).max(15).nullable().optional(),
  recognitionFP:   z.number().int().min(0).max(15).nullable().optional(),
});

// ─── Normas simplificadas (Malloy-Diniz et al.) ───────────────────────────────

function getPercentileLearning(total: number, age: number): number {
  // p5 / p25 / p50 / p75 / p95
  const norm = age < 50
    ? [35, 44, 52, 60, 68]
    : age < 65
    ? [30, 39, 47, 55, 63]
    : [25, 33, 41, 50, 58];
  return interpolatePercentile(total, norm);
}

function getPercentileRecall(score: number, age: number): number {
  const norm = age < 50
    ? [5, 8, 10, 13, 15]
    : age < 65
    ? [4, 7,  9, 12, 14]
    : [3, 5,  8, 11, 13];
  return interpolatePercentile(score, norm);
}

function interpolatePercentile(score: number, [p5, p25, p50, p75, p95]: number[]): number {
  const anchors: [number, number][] = [[p5, 5], [p25, 25], [p50, 50], [p75, 75], [p95, 95]];
  if (score <= p5)  return 5;
  if (score >= p95) return 95;
  for (let i = 0; i < anchors.length - 1; i++) {
    const [rLo, pLo] = anchors[i];
    const [rHi, pHi] = anchors[i + 1];
    if (score >= rLo && score <= rHi) {
      return Math.round(pLo + ((score - rLo) / (rHi - rLo)) * (pHi - pLo));
    }
  }
  return 50;
}

function classifyPct(p: number): string {
  if (p <= 5)  return "Muito Inferior";
  if (p <= 25) return "Inferior";
  if (p <= 75) return "Médio";
  if (p <= 95) return "Superior";
  return "Muito Superior";
}

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
      include: { patient: { select: { dateOfBirth: true } } },
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
      trialA1, trialA2, trialA3, trialA4, trialA5,
      trialB1, recallShort, recallLong,
      recognitionHits, recognitionFP,
    } = parsed.data;

    // ── Calcular idade ──────────────────────────────────────────────────────
    const dob = new Date(evaluation.patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) age--;

    // ── Escores derivados ───────────────────────────────────────────────────
    const totalLearning        = trialA1 + trialA2 + trialA3 + trialA4 + trialA5;
    const learningSlope        = trialA5 - trialA1;
    const proactiveInhibition  = trialB1 - trialA1;
    const retroactiveInhibition = recallShort - trialA5;
    const savingsShortPct      = trialA5 > 0 ? Math.round((recallShort / trialA5) * 1000) / 10 : 0;
    const savingsLongPct       = trialA5 > 0 ? Math.round((recallLong  / trialA5) * 1000) / 10 : 0;
    const recognitionIndex     = recognitionHits != null && recognitionFP != null
      ? recognitionHits - recognitionFP : null;

    // ── Percentis e classificações ──────────────────────────────────────────
    const percentileTotalLearning = getPercentileLearning(totalLearning, age);
    const percentileRecallShort   = getPercentileRecall(recallShort, age);
    const percentileRecallLong    = getPercentileRecall(recallLong,  age);
    const percentileRecognition   = recognitionIndex != null
      ? Math.min(99, Math.max(1, Math.round(((recognitionIndex + 15) / 30) * 98 + 1)))
      : null;

    const classificationLearning    = classifyPct(percentileTotalLearning);
    const classificationRecallShort = classifyPct(percentileRecallShort);
    const classificationRecallLong  = classifyPct(percentileRecallLong);

    const interpretation =
      `Aprendizagem Total (A1–A5): ${totalLearning}/75 (p${percentileTotalLearning} — ${classificationLearning}). ` +
      `Curva: ${trialA1}→${trialA2}→${trialA3}→${trialA4}→${trialA5} (ganho: ${learningSlope > 0 ? "+" : ""}${learningSlope}). ` +
      `Inibição proativa (B1−A1): ${proactiveInhibition > 0 ? "+" : ""}${proactiveInhibition}. ` +
      `Recordação imediata: ${recallShort} (p${percentileRecallShort} — ${classificationRecallShort}; retenção: ${savingsShortPct}%). ` +
      `Recordação tardia: ${recallLong} (p${percentileRecallLong} — ${classificationRecallLong}; retenção: ${savingsLongPct}%).` +
      (recognitionIndex != null ? ` Reconhecimento: ${recognitionHits} acertos, ${recognitionFP} FP (índice: ${recognitionIndex}).` : "");

    // ── Upsert ──────────────────────────────────────────────────────────────
    const data = {
      trialA1, trialA2, trialA3, trialA4, trialA5,
      trialB1, recallShort, recallLong,
      recognitionHits: recognitionHits ?? null,
      recognitionFP:   recognitionFP   ?? null,
      totalLearning, learningSlope, proactiveInhibition, retroactiveInhibition,
      savingsShortPct, savingsLongPct, recognitionIndex,
      percentileTotalLearning, percentileRecallShort, percentileRecallLong, percentileRecognition,
      classificationLearning, classificationRecallShort, classificationRecallLong,
      interpretation,
    };

    const saved = await prisma.testRavlt.upsert({
      where:  { evaluationId },
      create: { evaluationId, ...data },
      update: data,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/ravlt]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erro interno", detail: message }, { status: 500 });
  }
}
