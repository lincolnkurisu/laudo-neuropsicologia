export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().min(1).default("Avaliação Neuropsicológica"),
});

// GET /api/evaluations
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { id: true, fullName: true } },
        testAsrs18: { select: { id: true } },
        testBfp:   { select: { id: true } },
        testBpa2:  { select: { id: true } },
        testWasi:  { select: { id: true } },
        testFdt:   { select: { id: true } },
      },
    });

    return NextResponse.json(evaluations);
  } catch (err) {
    console.error("[GET /api/evaluations]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/evaluations
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Verifica que o paciente pertence ao psicólogo
    const patient = await prisma.patient.findFirst({
      where: { id: parsed.data.patientId, userId: session.user.id },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        userId:    session.user.id,
        patientId: parsed.data.patientId,
        title:     parsed.data.title,
      },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (err) {
    console.error("[POST /api/evaluations]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
