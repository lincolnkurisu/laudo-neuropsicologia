export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  rawNeuroticismo: z.number().min(0).max(120),
  rawExtroversao:  z.number().min(0).max(84),
  rawSocializacao: z.number().min(0).max(84),
  rawRealizacao:   z.number().min(0).max(80),
  rawAbertura:     z.number().min(0).max(56),
});

// ─── Normal CDF approximation (Hart, 1968 rational approximation) ─────────────

function normCDF(z: number): number {
  // Abramowitz & Stegun approximation — max error < 7.5e-8
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = z >= 0 ? 1 : -1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const erfc = poly * Math.exp(-absZ * absZ);
  return 0.5 * (1.0 + sign * (1.0 - erfc));
}

// ─── BFP norms (Nunes et al., 2010 — Brazilian standardization) ──────────────

interface FactorNorm {
  mean: number;
  sd: number;
}

const BFP_NORMS: Record<string, FactorNorm> = {
  neuroticismo: { mean: 55, sd: 22 },
  extroversao:  { mean: 57, sd: 15 },
  socializacao: { mean: 62, sd: 13 },
  realizacao:   { mean: 55, sd: 14 },
  abertura:     { mean: 38, sd: 9  },
};

function rawToPercentile(raw: number, norm: FactorNorm): number {
  const z = (raw - norm.mean) / norm.sd;
  return Math.min(99, Math.max(1, Math.round(normCDF(z) * 100)));
}

function classifyBfpFactor(percentile: number, isNeuroticismo: boolean): string {
  if (percentile <= 25) return "Baixo";
  if (percentile <= 74) return "Médio";
  return isNeuroticismo ? "Elevado" : "Alto";
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
      rawNeuroticismo,
      rawExtroversao,
      rawSocializacao,
      rawRealizacao,
      rawAbertura,
    } = parsed.data;

    const percentileNeuroticismo = rawToPercentile(rawNeuroticismo, BFP_NORMS.neuroticismo);
    const percentileExtroversao  = rawToPercentile(rawExtroversao,  BFP_NORMS.extroversao);
    const percentileSocializacao = rawToPercentile(rawSocializacao, BFP_NORMS.socializacao);
    const percentileRealizacao   = rawToPercentile(rawRealizacao,   BFP_NORMS.realizacao);
    const percentileAbertura     = rawToPercentile(rawAbertura,     BFP_NORMS.abertura);

    const classificationNeuroticismo = classifyBfpFactor(percentileNeuroticismo, true);
    const classificationExtroversao  = classifyBfpFactor(percentileExtroversao,  false);
    const classificationSocializacao = classifyBfpFactor(percentileSocializacao, false);
    const classificationRealizacao   = classifyBfpFactor(percentileRealizacao,   false);
    const classificationAbertura     = classifyBfpFactor(percentileAbertura,     false);

    const saved = await prisma.testBfp.upsert({
      where: { evaluationId },
      create: {
        evaluationId,
        rawItems: {},
        rawNeuroticismo,
        rawExtroversao,
        rawSocializacao,
        rawRealizacao,
        rawAbertura,
        percentileNeuroticismo,
        percentileExtroversao,
        percentileSocializacao,
        percentileRealizacao,
        percentileAbertura,
        classificationNeuroticismo,
        classificationExtroversao,
        classificationSocializacao,
        classificationRealizacao,
        classificationAbertura,
      },
      update: {
        rawItems: {},
        rawNeuroticismo,
        rawExtroversao,
        rawSocializacao,
        rawRealizacao,
        rawAbertura,
        percentileNeuroticismo,
        percentileExtroversao,
        percentileSocializacao,
        percentileRealizacao,
        percentileAbertura,
        classificationNeuroticismo,
        classificationExtroversao,
        classificationSocializacao,
        classificationRealizacao,
        classificationAbertura,
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
    console.error("[POST /api/evaluations/[id]/tests/bfp]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
