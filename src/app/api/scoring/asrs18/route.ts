import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreAsrs18 } from "@/services/scoring/asrs18";
import type { Asrs18Input } from "@/types";

const asrs18Schema = z.object({
  items: z
    .array(z.number().int().min(0).max(4))
    .length(18, "Exatamente 18 itens são necessários"),
});

/**
 * POST /api/scoring/asrs18
 * Body: { items: number[18] }
 * Retorna os escores calculados sem salvar no banco.
 * Útil para preview em tempo real no formulário.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = asrs18Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input: Asrs18Input = { items: parsed.data.items as Asrs18Input["items"] };
    const result = scoreAsrs18(input);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json(result.scores);
  } catch (err) {
    console.error("[POST /api/scoring/asrs18]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
