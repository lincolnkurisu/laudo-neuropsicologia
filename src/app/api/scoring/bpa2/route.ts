import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreBpa2 } from "@/services/scoring/bpa2";
import { EducationLevel } from "@/generated/prisma";

const bpa2Schema = z.object({
  concentradaAcertos: z.number().int().min(0),
  concentradaErros:   z.number().int().min(0),
  divididaAcertos:    z.number().int().min(0),
  divididaErros:      z.number().int().min(0),
  alternadaAcertos:   z.number().int().min(0),
  alternadaErros:     z.number().int().min(0),
  age:                z.number().int().min(1).max(120),
  educationLevel:     z.nativeEnum(EducationLevel),
});

/**
 * POST /api/scoring/bpa2
 * Body: BPA-2 inputs + dados demográficos para busca normativa
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bpa2Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = scoreBpa2(parsed.data);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json(result.scores);
  } catch (err) {
    console.error("[POST /api/scoring/bpa2]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
