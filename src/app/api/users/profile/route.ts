export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  crp: z.string().optional().nullable(),
  clinicName: z.string().optional().nullable(),
});

// GET /api/users/profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, crp: true, clinicName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("[GET /api/users/profile]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT /api/users/profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        crp: parsed.data.crp ?? null,
        clinicName: parsed.data.clinicName ?? null,
      },
      select: { id: true, name: true, email: true, crp: true, clinicName: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("[PUT /api/users/profile]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
