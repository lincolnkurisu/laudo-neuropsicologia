export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  hits:         z.number().int().min(0),
  omissions:    z.number().int().min(0),
  commissions:  z.number().int().min(0),
  totalTargets: z.number().int().min(1),
  meanHitRT:    z.number().min(0),
  hitRTse:      z.number().min(0),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

function classifyHitRate(r: number): string {
  if (r >= 90) return "Superior";
  if (r >= 75) return "Médio";
  if (r >= 60) return "Médio-Inferior";
  return "Rebaixado";
}

function classifyRT(rt: number): string {
  if (rt <= 350) return "Superior";
  if (rt <= 500) return "Médio";
  if (rt <= 700) return "Médio-Inferior";
  return "Rebaixado";
}

function classifyVariability(se: number): string {
  if (se <= 50) return "Superior";
  if (se <= 100) return "Médio";
  if (se <= 150) return "Médio-Inferior";
  return "Rebaixado";
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

    const { hits, omissions, commissions, totalTargets, meanHitRT, hitRTse } = parsed.data;

    const hitRate        = Math.round((hits        / totalTargets) * 100 * 10) / 10;
    const omissionRate   = Math.round((omissions   / totalTargets) * 100 * 10) / 10;
    const commissionRate = Math.round((commissions / totalTargets) * 100 * 10) / 10;

    const hitRateClass     = classifyHitRate(hitRate);
    const rtClass          = classifyRT(meanHitRT);
    const variabilityClass = classifyVariability(hitRTse);

    let interpretation: string;
    if (hitRate >= 90 && commissions <= 5 && meanHitRT <= 500) {
      interpretation = "Atenção sustentada dentro do esperado";
    } else if (hitRate >= 75 || commissions <= 10) {
      interpretation = "Dificuldades leves de atenção sustentada";
    } else if (hitRate < 60 || commissions > 15) {
      interpretation = "Déficit significativo de atenção sustentada e controle inibitório";
    } else {
      interpretation = "Atenção sustentada moderadamente comprometida";
    }

    const fields = {
      hits,
      omissions,
      commissions,
      totalTargets,
      meanHitRT,
      hitRTse,
      hitRate,
      omissionRate,
      commissionRate,
      hitRateClass,
      rtClass,
      variabilityClass,
      interpretation,
    };

    const saved = await prisma.testCtp.upsert({
      where: { evaluationId },
      create: { evaluationId, ...fields },
      update: fields,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/ctp]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
