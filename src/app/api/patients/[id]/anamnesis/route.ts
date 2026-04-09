export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const anamnesisSchema = z.object({
  mainComplaint:           z.string().min(3, "Queixa principal é obrigatória"),
  complaintDuration:       z.string().optional().nullable(),
  referralSource:          z.string().optional().nullable(),
  medicalHistory:          z.string().optional().nullable(),
  currentMedications:      z.string().optional().nullable(),
  previousTreatments:      z.string().optional().nullable(),
  familyHistory:           z.string().optional().nullable(),
  birthConditions:         z.string().optional().nullable(),
  developmentalMilestones: z.string().optional().nullable(),
  schoolHistory:           z.string().optional().nullable(),
  learningDifficulties:    z.string().optional().nullable(),
  livingSituation:         z.string().optional().nullable(),
  socialSupport:           z.string().optional().nullable(),
  recentLifeEvents:        z.string().optional().nullable(),
  sleepQuality:            z.string().optional().nullable(),
  physicalActivity:        z.string().optional().nullable(),
  substanceUse:            z.string().optional().nullable(),
  clinicalObservations:    z.string().optional().nullable(),
  behaviorDuringSession:   z.string().optional().nullable(),
});

// POST /api/patients/[id]/anamnesis
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: patientId } = await params;

    // Verifica se o paciente pertence ao usuário logado
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = anamnesisSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const anamnesis = await prisma.anamnesis.create({
      data: {
        patientId,
        ...parsed.data,
      },
    });

    return NextResponse.json(anamnesis, { status: 201 });
  } catch (err) {
    console.error("[POST /api/patients/[id]/anamnesis]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
