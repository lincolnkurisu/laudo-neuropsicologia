/**
 * ASRS-18 Scoring Service
 * Adult ADHD Self-Report Scale – versão 18 itens (OMS)
 *
 * Estrutura:
 *  - Parte A (Desatenção):          itens 1–9
 *  - Parte B (Hiperatividade/Imp.): itens 10–18
 *
 * Escala Likert:
 *  0 = Nunca | 1 = Raramente | 2 = Às vezes | 3 = Frequentemente | 4 = Muito frequentemente
 *
 * Ponto de corte clínico (Kessler et al., 2005):
 *  - Parte A: ≥ 4 itens com resposta ≥ 3 (Frequentemente ou mais) → suspeita de TDAH
 *  - Soma total pode complementar a interpretação clínica
 *
 * ATENÇÃO: Os pontos de corte abaixo são baseados na versão original.
 * Ajuste conforme as normas da versão brasileira validada que você utilizar.
 */

import type { Asrs18Input, Asrs18Scores, ScoringResult } from "@/types";

// ─── Configuração dos pontos de corte ────────────────────────────────────────

/**
 * Limiar de resposta para um item ser considerado "positivo" clinicamente.
 * Valores ≥ CLINICAL_THRESHOLD contam para o ponto de corte.
 */
const CLINICAL_THRESHOLD = 3; // Frequentemente (3) ou Muito frequentemente (4)

/**
 * Quantidade mínima de itens positivos na Parte A para suspeita clínica.
 * Kessler et al. (2005) indicam ≥ 4 dos 6 primeiros itens da Parte A;
 * aqui usamos os 9 itens completos — ajuste conforme o instrumento validado.
 */
const PART_A_CUTOFF = 4;

/**
 * Quantidade mínima de itens positivos na Parte B para suspeita clínica.
 * Placeholder — preencha com o critério do manual que você adotou.
 */
const PART_B_CUTOFF = 4;

// ─── Validação ───────────────────────────────────────────────────────────────

function validateItems(items: number[]): string | null {
  if (items.length !== 18) {
    return `Esperados 18 itens, recebidos ${items.length}.`;
  }
  for (let i = 0; i < items.length; i++) {
    const v = items[i];
    if (!Number.isInteger(v) || v < 0 || v > 4) {
      return `Item ${i + 1} inválido: "${v}". Valores permitidos: 0–4.`;
    }
  }
  return null;
}

// ─── Função principal de correção ────────────────────────────────────────────

export function scoreAsrs18(input: Asrs18Input): ScoringResult<Asrs18Scores> {
  const { items } = input;

  const validationError = validateItems(items);
  if (validationError) {
    return { scores: {} as Asrs18Scores, error: validationError };
  }

  // Divide em Parte A (índices 0-8) e Parte B (índices 9-17)
  const partA = items.slice(0, 9);
  const partB = items.slice(9, 18);

  // Soma bruta de cada parte
  const scorePartA = partA.reduce((sum, v) => sum + v, 0);
  const scorePartB = partB.reduce((sum, v) => sum + v, 0);
  const totalScore = scorePartA + scorePartB;

  // Itens positivos (≥ limiar clínico)
  const partAPositiveItems = partA.filter((v) => v >= CLINICAL_THRESHOLD).length;
  const partBPositiveItems = partB.filter((v) => v >= CLINICAL_THRESHOLD).length;

  // Decisão clínica: ambas as partes precisam atingir o corte
  const clinicalSignificant =
    partAPositiveItems >= PART_A_CUTOFF || partBPositiveItems >= PART_B_CUTOFF;

  // Geração de interpretação textual
  const interpretation = buildInterpretation({
    scorePartA,
    scorePartB,
    totalScore,
    partAPositiveItems,
    partBPositiveItems,
    clinicalSignificant,
  });

  return {
    scores: {
      scorePartA,
      scorePartB,
      totalScore,
      partAPositiveItems,
      partBPositiveItems,
      clinicalSignificant,
      interpretation,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface InterpretationInput {
  scorePartA: number;
  scorePartB: number;
  totalScore: number;
  partAPositiveItems: number;
  partBPositiveItems: number;
  clinicalSignificant: boolean;
}

function buildInterpretation(data: InterpretationInput): string {
  const parts: string[] = [];

  parts.push(
    `Pontuação Parte A (Desatenção): ${data.scorePartA}/36 ` +
      `(${data.partAPositiveItems} itens acima do limiar clínico).`
  );

  parts.push(
    `Pontuação Parte B (Hiperatividade/Impulsividade): ${data.scorePartB}/36 ` +
      `(${data.partBPositiveItems} itens acima do limiar clínico).`
  );

  parts.push(`Pontuação Total: ${data.totalScore}/72.`);

  if (data.clinicalSignificant) {
    parts.push(
      "Resultado SUGESTIVO de TDAH: o padrão de respostas atinge o ponto de corte clínico " +
        "em pelo menos uma das dimensões avaliadas. Recomenda-se avaliação clínica complementar."
    );
  } else {
    parts.push(
      "Resultado NÃO SUGESTIVO de TDAH: o padrão de respostas não atingiu o ponto de corte " +
        "clínico nas dimensões avaliadas."
    );
  }

  return parts.join(" ");
}

// ─── Conversão DB → Input ────────────────────────────────────────────────────

/**
 * Converte os campos individuais (item1…item18) do modelo Prisma
 * para o formato esperado pela função de scoring.
 */
export function dbRowToAsrs18Input(row: {
  item1: number; item2: number; item3: number; item4: number; item5: number;
  item6: number; item7: number; item8: number; item9: number; item10: number;
  item11: number; item12: number; item13: number; item14: number; item15: number;
  item16: number; item17: number; item18: number;
}): Asrs18Input {
  return {
    items: [
      row.item1, row.item2, row.item3, row.item4, row.item5, row.item6,
      row.item7, row.item8, row.item9, row.item10, row.item11, row.item12,
      row.item13, row.item14, row.item15, row.item16, row.item17, row.item18,
    ],
  };
}
