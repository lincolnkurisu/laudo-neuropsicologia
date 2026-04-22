export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_TEST_KEYS = [
  "testAsrs18", "testBfp", "testBpa2", "testWasi", "testFdt",
  "testRavlt", "testMoca", "testBdi2", "testBai", "testTmt",
  "testRey", "testFluencia", "testDiva2", "testCaars", "testCtp",
  "testWcst", "testTorreLondres", "testMfft", "testFauxPas",
] as const;

type TestKey = typeof VALID_TEST_KEYS[number];

const bodySchema = z.object({
  testKey: z.enum(VALID_TEST_KEYS),
});

const MODEL_MAP: Record<TestKey, (evaluationId: string) => Promise<unknown>> = {
  testAsrs18:       (eid) => prisma.testAsrs18.delete({ where: { evaluationId: eid } }),
  testBfp:          (eid) => prisma.testBfp.delete({ where: { evaluationId: eid } }),
  testBpa2:         (eid) => prisma.testBpa2.delete({ where: { evaluationId: eid } }),
  testWasi:         (eid) => prisma.testWasi.delete({ where: { evaluationId: eid } }),
  testFdt:          (eid) => prisma.testFdt.delete({ where: { evaluationId: eid } }),
  testRavlt:        (eid) => prisma.testRavlt.delete({ where: { evaluationId: eid } }),
  testMoca:         (eid) => prisma.testMoca.delete({ where: { evaluationId: eid } }),
  testBdi2:         (eid) => prisma.testBdi2.delete({ where: { evaluationId: eid } }),
  testBai:          (eid) => prisma.testBai.delete({ where: { evaluationId: eid } }),
  testTmt:          (eid) => prisma.testTmt.delete({ where: { evaluationId: eid } }),
  testRey:          (eid) => prisma.testRey.delete({ where: { evaluationId: eid } }),
  testFluencia:     (eid) => prisma.testFluencia.delete({ where: { evaluationId: eid } }),
  testDiva2:        (eid) => prisma.testDiva2.delete({ where: { evaluationId: eid } }),
  testCaars:        (eid) => prisma.testCaars.delete({ where: { evaluationId: eid } }),
  testCtp:          (eid) => prisma.testCtp.delete({ where: { evaluationId: eid } }),
  testWcst:         (eid) => prisma.testWcst.delete({ where: { evaluationId: eid } }),
  testTorreLondres: (eid) => prisma.testTorreLondres.delete({ where: { evaluationId: eid } }),
  testMfft:         (eid) => prisma.testMfft.delete({ where: { evaluationId: eid } }),
  testFauxPas:      (eid) => prisma.testFauxPas.delete({ where: { evaluationId: eid } }),
};

interface RouteContext { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: evaluationId } = await params;

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: evaluationId, userId: session.user.id },
      select: { id: true },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Teste inválido" }, { status: 400 });
    }

    await MODEL_MAP[parsed.data.testKey](evaluationId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/evaluations/[id]/tests/clear]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
