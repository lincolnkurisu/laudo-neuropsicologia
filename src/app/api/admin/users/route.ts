export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      crp: true,
      clinicName: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { patients: true, evaluations: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}
