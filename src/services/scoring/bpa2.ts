/**
 * BPA-2 Scoring Service
 * Bateria de Provas de Atenção – 2ª edição (Rueda, 2013)
 *
 * Subtestes:
 *  1. Atenção Concentrada (AC) – Quadradinhos
 *  2. Atenção Dividida   (AD) – Figuras & Letras simultâneas
 *  3. Atenção Alternada  (AA) – Troca de critério a cada linha
 *
 * Fórmula do Ponto Bruto: PB = Acertos − Erros
 * Normatização: Percentis estratificados por Faixa Etária × Nível de Escolaridade
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TABELAS NORMATIVAS (PLACEHOLDERS)
 * ─────────────────────────────────────────────────────────────────────────────
 * As tabelas abaixo são FICTÍCIAS e servem apenas para demonstrar a arquitetura.
 * Substitua os valores pelos dados normativos oficiais do manual da BPA-2
 * antes de usar em contexto clínico real.
 *
 * Estrutura: normsTable[subteste][faixaEtaria][grupoEscolaridade] = [{ pb, percentile }]
 * Os arrays estão ordenados de forma crescente por PB.
 * A busca usa interpolação linear entre pontos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { EducationLevel, classifyPercentile, getEducationGroup } from "@/types";
import type { Bpa2Input, Bpa2Scores, ScoringResult, EducationGroup } from "@/types";

// ─── Tipos das tabelas normativas ────────────────────────────────────────────

interface NormPoint {
  pb: number;
  percentile: number;
}

type NormsByEducation = Record<EducationGroup, NormPoint[]>;
type NormsByAge = Record<string, NormsByEducation>; // chave = "min-max"
type SubtestNorms = NormsByAge;

// ─── Faixas etárias disponíveis ──────────────────────────────────────────────

type AgeRange = "17-25" | "26-35" | "36-45" | "46-60";

function getAgeRange(age: number): AgeRange | null {
  if (age >= 17 && age <= 25) return "17-25";
  if (age >= 26 && age <= 35) return "26-35";
  if (age >= 36 && age <= 45) return "36-45";
  if (age >= 46 && age <= 60) return "46-60";
  return null;
}

// ─── Tabelas normativas (PLACEHOLDER) ────────────────────────────────────────
//
// INSTRUÇÕES PARA O PSICÓLOGO/DESENVOLVEDOR:
// Substitua cada array abaixo pelos dados da Tabela X do Manual da BPA-2.
// Mantenha a ordem crescente de `pb`. Adicione quantos pontos forem necessários.
//
// Exemplo de entrada real:
//   { pb: 10, percentile: 5 }   → PB 10 corresponde ao percentil 5
//   { pb: 20, percentile: 25 }  → PB 20 corresponde ao percentil 25

// ── Atenção Concentrada ──────────────────────────────────────────────────────

const acNorms: SubtestNorms = {
  "17-25": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 10, percentile: 10 }, { pb: 20, percentile: 25 }, { pb: 35, percentile: 50 }, { pb: 50, percentile: 75 }, { pb: 65, percentile: 95 }, { pb: 75, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 12, percentile: 10 }, { pb: 25, percentile: 25 }, { pb: 40, percentile: 50 }, { pb: 55, percentile: 75 }, { pb: 68, percentile: 95 }, { pb: 78, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 15, percentile: 10 }, { pb: 30, percentile: 25 }, { pb: 45, percentile: 50 }, { pb: 60, percentile: 75 }, { pb: 72, percentile: 95 }, { pb: 80, percentile: 99 }],
  },
  "26-35": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 8,  percentile: 10 }, { pb: 18, percentile: 25 }, { pb: 33, percentile: 50 }, { pb: 48, percentile: 75 }, { pb: 62, percentile: 95 }, { pb: 72, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 10, percentile: 10 }, { pb: 22, percentile: 25 }, { pb: 38, percentile: 50 }, { pb: 52, percentile: 75 }, { pb: 65, percentile: 95 }, { pb: 75, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 13, percentile: 10 }, { pb: 28, percentile: 25 }, { pb: 43, percentile: 50 }, { pb: 58, percentile: 75 }, { pb: 70, percentile: 95 }, { pb: 79, percentile: 99 }],
  },
  "36-45": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 6,  percentile: 10 }, { pb: 15, percentile: 25 }, { pb: 30, percentile: 50 }, { pb: 45, percentile: 75 }, { pb: 58, percentile: 95 }, { pb: 68, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 8,  percentile: 10 }, { pb: 20, percentile: 25 }, { pb: 35, percentile: 50 }, { pb: 48, percentile: 75 }, { pb: 62, percentile: 95 }, { pb: 72, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 11, percentile: 10 }, { pb: 25, percentile: 25 }, { pb: 40, percentile: 50 }, { pb: 54, percentile: 75 }, { pb: 66, percentile: 95 }, { pb: 76, percentile: 99 }],
  },
  "46-60": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 4,  percentile: 10 }, { pb: 12, percentile: 25 }, { pb: 26, percentile: 50 }, { pb: 40, percentile: 75 }, { pb: 54, percentile: 95 }, { pb: 64, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 6,  percentile: 10 }, { pb: 17, percentile: 25 }, { pb: 31, percentile: 50 }, { pb: 45, percentile: 75 }, { pb: 58, percentile: 95 }, { pb: 68, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 9,  percentile: 10 }, { pb: 22, percentile: 25 }, { pb: 37, percentile: 50 }, { pb: 50, percentile: 75 }, { pb: 63, percentile: 95 }, { pb: 73, percentile: 99 }],
  },
};

// ── Atenção Dividida ─────────────────────────────────────────────────────────

const adNorms: SubtestNorms = {
  "17-25": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 5,  percentile: 10 }, { pb: 12, percentile: 25 }, { pb: 20, percentile: 50 }, { pb: 30, percentile: 75 }, { pb: 40, percentile: 95 }, { pb: 48, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 7,  percentile: 10 }, { pb: 15, percentile: 25 }, { pb: 24, percentile: 50 }, { pb: 34, percentile: 75 }, { pb: 43, percentile: 95 }, { pb: 50, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 9,  percentile: 10 }, { pb: 18, percentile: 25 }, { pb: 28, percentile: 50 }, { pb: 38, percentile: 75 }, { pb: 46, percentile: 95 }, { pb: 52, percentile: 99 }],
  },
  "26-35": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 4,  percentile: 10 }, { pb: 10, percentile: 25 }, { pb: 18, percentile: 50 }, { pb: 28, percentile: 75 }, { pb: 38, percentile: 95 }, { pb: 46, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 6,  percentile: 10 }, { pb: 13, percentile: 25 }, { pb: 22, percentile: 50 }, { pb: 32, percentile: 75 }, { pb: 41, percentile: 95 }, { pb: 48, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 8,  percentile: 10 }, { pb: 16, percentile: 25 }, { pb: 26, percentile: 50 }, { pb: 36, percentile: 75 }, { pb: 44, percentile: 95 }, { pb: 50, percentile: 99 }],
  },
  "36-45": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 3,  percentile: 10 }, { pb: 8,  percentile: 25 }, { pb: 16, percentile: 50 }, { pb: 25, percentile: 75 }, { pb: 35, percentile: 95 }, { pb: 43, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 5,  percentile: 10 }, { pb: 11, percentile: 25 }, { pb: 20, percentile: 50 }, { pb: 29, percentile: 75 }, { pb: 38, percentile: 95 }, { pb: 46, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 7,  percentile: 10 }, { pb: 14, percentile: 25 }, { pb: 24, percentile: 50 }, { pb: 33, percentile: 75 }, { pb: 42, percentile: 95 }, { pb: 49, percentile: 99 }],
  },
  "46-60": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 2,  percentile: 10 }, { pb: 6,  percentile: 25 }, { pb: 13, percentile: 50 }, { pb: 22, percentile: 75 }, { pb: 32, percentile: 95 }, { pb: 40, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 4,  percentile: 10 }, { pb: 9,  percentile: 25 }, { pb: 17, percentile: 50 }, { pb: 26, percentile: 75 }, { pb: 35, percentile: 95 }, { pb: 43, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 6,  percentile: 10 }, { pb: 12, percentile: 25 }, { pb: 21, percentile: 50 }, { pb: 30, percentile: 75 }, { pb: 39, percentile: 95 }, { pb: 47, percentile: 99 }],
  },
};

// ── Atenção Alternada ────────────────────────────────────────────────────────

const aaNorms: SubtestNorms = {
  "17-25": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 3,  percentile: 10 }, { pb: 8,  percentile: 25 }, { pb: 15, percentile: 50 }, { pb: 23, percentile: 75 }, { pb: 32, percentile: 95 }, { pb: 40, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 5,  percentile: 10 }, { pb: 11, percentile: 25 }, { pb: 19, percentile: 50 }, { pb: 27, percentile: 75 }, { pb: 35, percentile: 95 }, { pb: 43, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 7,  percentile: 10 }, { pb: 14, percentile: 25 }, { pb: 22, percentile: 50 }, { pb: 30, percentile: 75 }, { pb: 38, percentile: 95 }, { pb: 46, percentile: 99 }],
  },
  "26-35": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 2,  percentile: 10 }, { pb: 7,  percentile: 25 }, { pb: 13, percentile: 50 }, { pb: 21, percentile: 75 }, { pb: 30, percentile: 95 }, { pb: 38, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 4,  percentile: 10 }, { pb: 9,  percentile: 25 }, { pb: 17, percentile: 50 }, { pb: 25, percentile: 75 }, { pb: 33, percentile: 95 }, { pb: 41, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 6,  percentile: 10 }, { pb: 12, percentile: 25 }, { pb: 20, percentile: 50 }, { pb: 28, percentile: 75 }, { pb: 36, percentile: 95 }, { pb: 44, percentile: 99 }],
  },
  "36-45": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 1,  percentile: 10 }, { pb: 5,  percentile: 25 }, { pb: 11, percentile: 50 }, { pb: 18, percentile: 75 }, { pb: 27, percentile: 95 }, { pb: 35, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 3,  percentile: 10 }, { pb: 8,  percentile: 25 }, { pb: 15, percentile: 50 }, { pb: 22, percentile: 75 }, { pb: 31, percentile: 95 }, { pb: 39, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 5,  percentile: 10 }, { pb: 11, percentile: 25 }, { pb: 18, percentile: 50 }, { pb: 26, percentile: 75 }, { pb: 34, percentile: 95 }, { pb: 42, percentile: 99 }],
  },
  "46-60": {
    low:    [{ pb: 0, percentile: 1 }, { pb: 0,  percentile: 5 },  { pb: 4,  percentile: 25 }, { pb: 9,  percentile: 50 }, { pb: 16, percentile: 75 }, { pb: 24, percentile: 95 }, { pb: 32, percentile: 99 }],
    medium: [{ pb: 0, percentile: 1 }, { pb: 2,  percentile: 10 }, { pb: 6,  percentile: 25 }, { pb: 12, percentile: 50 }, { pb: 20, percentile: 75 }, { pb: 28, percentile: 95 }, { pb: 36, percentile: 99 }],
    high:   [{ pb: 0, percentile: 1 }, { pb: 4,  percentile: 10 }, { pb: 9,  percentile: 25 }, { pb: 16, percentile: 50 }, { pb: 24, percentile: 75 }, { pb: 32, percentile: 95 }, { pb: 40, percentile: 99 }],
  },
};

// ─── Interpolação linear ──────────────────────────────────────────────────────

/**
 * Busca o percentil correspondente a um PB dado na tabela normativa,
 * usando interpolação linear entre os pontos mais próximos.
 */
function lookupPercentile(pb: number, norms: NormPoint[]): number {
  if (norms.length === 0) return 50;

  // Abaixo do menor ponto
  if (pb <= norms[0].pb) return norms[0].percentile;

  // Acima do maior ponto
  if (pb >= norms[norms.length - 1].pb) return norms[norms.length - 1].percentile;

  // Encontra intervalo [lower, upper]
  for (let i = 0; i < norms.length - 1; i++) {
    const lower = norms[i];
    const upper = norms[i + 1];
    if (pb >= lower.pb && pb <= upper.pb) {
      // Interpolação linear
      const ratio = (pb - lower.pb) / (upper.pb - lower.pb);
      return Math.round(lower.percentile + ratio * (upper.percentile - lower.percentile));
    }
  }

  return 50; // fallback
}

// ─── Lookup principal ─────────────────────────────────────────────────────────

function getPercentile(
  pb: number,
  norms: SubtestNorms,
  age: number,
  educationLevel: EducationLevel
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null; // Fora da faixa normativa

  const educGroup = getEducationGroup(educationLevel);
  const normPoints = norms[ageRange]?.[educGroup];
  if (!normPoints || normPoints.length === 0) return null;

  return lookupPercentile(pb, normPoints);
}

// ─── Função principal de correção ────────────────────────────────────────────

export function scoreBpa2(input: Bpa2Input): ScoringResult<Bpa2Scores> {
  const {
    concentradaAcertos, concentradaErros,
    divididaAcertos,    divididaErros,
    alternadaAcertos,   alternadaErros,
    age, educationLevel,
  } = input;

  // Calcula Pontos Brutos
  const concentradaPB = concentradaAcertos - concentradaErros;
  const divididaPB    = divididaAcertos    - divididaErros;
  const alternadaPB   = alternadaAcertos   - alternadaErros;

  // Busca percentis
  const concentradaPercentile = getPercentile(concentradaPB, acNorms, age, educationLevel);
  const divididaPercentile    = getPercentile(divididaPB,    adNorms, age, educationLevel);
  const alternadaPercentile   = getPercentile(alternadaPB,   aaNorms, age, educationLevel);

  // Classificações
  const concentradaClassification = concentradaPercentile !== null
    ? classifyPercentile(concentradaPercentile)
    : "Fora da faixa normativa";

  const divididaClassification = divididaPercentile !== null
    ? classifyPercentile(divididaPercentile)
    : "Fora da faixa normativa";

  const alternadaClassification = alternadaPercentile !== null
    ? classifyPercentile(alternadaPercentile)
    : "Fora da faixa normativa";

  return {
    scores: {
      concentradaPB,
      divididaPB,
      alternadaPB,
      concentradaPercentile,
      divididaPercentile,
      alternadaPercentile,
      concentradaClassification,
      divididaClassification,
      alternadaClassification,
    },
  };
}
