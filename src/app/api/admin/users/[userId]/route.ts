export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext { params: Promise<{ userId: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Não é possível excluir sua própria conta por aqui. Use Configurações." },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Não pode alterar seu próprio papel" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: !user.isAdmin },
    select: { id: true, isAdmin: true },
  });

  return NextResponse.json(updated);
}
