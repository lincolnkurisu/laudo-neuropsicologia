export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// TODO: substituir pelo userId real da sessão (NextAuth / Clerk)
const DEMO_USER_ID = "demo-user-id";

const profileSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  crp: z.string().optional().nullable(),
  clinicName: z.string().optional().nullable(),
});

// GET /api/users/profile — retorna perfil do usuário logado
export async function GET() {
  try {
    const user = await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      update: {},
      create: {
        id: DEMO_USER_ID,
        email: "demo@neuropsi.app",
        name: "Dr. Psicólogo",
      },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[GET /api/users/profile]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT /api/users/profile — atualiza perfil do usuário logado
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      update: {
        name: parsed.data.name,
        email: parsed.data.email,
        crp: parsed.data.crp ?? null,
        clinicName: parsed.data.clinicName ?? null,
      },
      create: {
        id: DEMO_USER_ID,
        name: parsed.data.name,
        email: parsed.data.email,
        crp: parsed.data.crp ?? null,
        clinicName: parsed.data.clinicName ?? null,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("[PUT /api/users/profile]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
