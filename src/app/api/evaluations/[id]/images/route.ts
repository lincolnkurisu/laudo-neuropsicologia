export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/evaluations/[id]/images — upload a new image
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Armazenamento de imagens não configurado" },
        { status: 503 }
      );
    }

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

    const formData = await req.formData();
    const file = formData.get("file");
    const description = formData.get("description")?.toString() ?? null;
    const testType = formData.get("testType")?.toString() ?? null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
    }

    const blobPath = `evaluations/${evaluationId}/${Date.now()}-${file.name}`;

    const blob = await put(blobPath, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const image = await prisma.evaluationImage.create({
      data: {
        evaluationId,
        url: blob.url,
        fileName: file.name,
        description,
        testType,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (err) {
    console.error("[POST /api/evaluations/[id]/images]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET /api/evaluations/[id]/images — list all images for the evaluation
export async function GET(_req: NextRequest, { params }: RouteContext) {
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

    const images = await prisma.evaluationImage.findMany({
      where: { evaluationId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(images);
  } catch (err) {
    console.error("[GET /api/evaluations/[id]/images]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/evaluations/[id]/images — delete an image by id (passed in body)
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Armazenamento de imagens não configurado" },
        { status: 503 }
      );
    }

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
    const { imageId } = body as { imageId?: string };

    if (!imageId) {
      return NextResponse.json({ error: "imageId é obrigatório" }, { status: 400 });
    }

    const image = await prisma.evaluationImage.findFirst({
      where: { id: imageId, evaluationId },
    });

    if (!image) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
    }

    // Delete from blob storage
    await del(image.url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    // Delete from database
    await prisma.evaluationImage.delete({ where: { id: imageId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/evaluations/[id]/images]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
