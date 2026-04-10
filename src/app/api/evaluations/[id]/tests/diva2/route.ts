export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  iaAdult: z.array(z.boolean()).length(9),
  iaChild: z.array(z.boolean()).length(9),
  hiAdult: z.array(z.boolean()).length(9),
  hiChild: z.array(z.boolean()).length(9),
  age: z.number().int().min(0),
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

    const { iaAdult, iaChild, hiAdult, hiChild, age } = parsed.data;

    const iaAdultCount = iaAdult.filter(Boolean).length;
    const iaChildCount = iaChild.filter(Boolean).length;
    const hiAdultCount = hiAdult.filter(Boolean).length;
    const hiChildCount = hiChild.filter(Boolean).length;

    const threshold = age >= 17 ? 5 : 6;

    const meetsIaAdult = iaAdultCount >= threshold;
    const meetsHiAdult = hiAdultCount >= threshold;
    const meetsIaChild = iaChildCount >= 6;
    const meetsHiChild = hiChildCount >= 6;

    let diagnosis: string;
    if (meetsIaAdult && meetsHiAdult && meetsIaChild && meetsHiChild) {
      diagnosis = "TDAH Combinado";
    } else if (meetsIaAdult && meetsIaChild && (!meetsHiAdult || !meetsHiChild)) {
      diagnosis = "TDAH Predominantemente Desatento";
    } else if (meetsHiAdult && meetsHiChild && (!meetsIaAdult || !meetsIaChild)) {
      diagnosis = "TDAH Predominantemente Hiperativo-Impulsivo";
    } else {
      diagnosis = "Não atende critérios diagnósticos";
    }

    const fields = {
      iaAdult1: iaAdult[0], iaAdult2: iaAdult[1], iaAdult3: iaAdult[2],
      iaAdult4: iaAdult[3], iaAdult5: iaAdult[4], iaAdult6: iaAdult[5],
      iaAdult7: iaAdult[6], iaAdult8: iaAdult[7], iaAdult9: iaAdult[8],

      iaChild1: iaChild[0], iaChild2: iaChild[1], iaChild3: iaChild[2],
      iaChild4: iaChild[3], iaChild5: iaChild[4], iaChild6: iaChild[5],
      iaChild7: iaChild[6], iaChild8: iaChild[7], iaChild9: iaChild[8],

      hiAdult1: hiAdult[0], hiAdult2: hiAdult[1], hiAdult3: hiAdult[2],
      hiAdult4: hiAdult[3], hiAdult5: hiAdult[4], hiAdult6: hiAdult[5],
      hiAdult7: hiAdult[6], hiAdult8: hiAdult[7], hiAdult9: hiAdult[8],

      hiChild1: hiChild[0], hiChild2: hiChild[1], hiChild3: hiChild[2],
      hiChild4: hiChild[3], hiChild5: hiChild[4], hiChild6: hiChild[5],
      hiChild7: hiChild[6], hiChild8: hiChild[7], hiChild9: hiChild[8],

      iaAdultCount,
      iaChildCount,
      hiAdultCount,
      hiChildCount,

      meetsIaAdult,
      meetsHiAdult,
      meetsIaChild,
      meetsHiChild,

      diagnosis,
    };

    const saved = await prisma.testDiva2.upsert({
      where: { evaluationId },
      create: { evaluationId, ...fields },
      update: fields,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/tests/diva2]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
