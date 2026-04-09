export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";


const createPatientSchema = z.object({
  fullName: z.string().min(3),
  dateOfBirth: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  educationLevel: z.enum([
    "NO_FORMAL_EDUCATION", "INCOMPLETE_ELEMENTARY", "COMPLETE_ELEMENTARY",
    "INCOMPLETE_HIGH_SCHOOL", "COMPLETE_HIGH_SCHOOL",
    "INCOMPLETE_HIGHER", "COMPLETE_HIGHER", "POSTGRADUATE",
  ]),
  occupation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  cpf: z.string().optional().nullable(),
});

// GET /api/patients — lista todos os pacientes do usuário autenticado
export async function GET() {
  try {
    // TODO: extrair userId da sessão (NextAuth / Clerk)
    const userId = "demo-user-id";

    const patients = await prisma.patient.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { evaluations: true, anamneses: true } },
      },
    });

    return NextResponse.json(patients);
  } catch (err) {
    console.error("[GET /api/patients]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST /api/patients — cria novo paciente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    // TODO: extrair userId da sessão
    const userId = "demo-user-id";

    // Garante que o usuário demo exista no banco
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "demo@neuropsi.app",
        name: "Usuário Demo",
      },
    });

    const patient = await prisma.patient.create({
      data: {
        userId,
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        educationLevel: data.educationLevel,
        occupation: data.occupation,
        phone: data.phone,
        email: data.email ?? undefined,
        cpf: data.cpf ?? undefined,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/patients]", err);
    const error = err as { code?: string };
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
