/**
 * RAVLT Scoring Service
 * Rey Auditory Verbal Learning Test (Rey, 1964)
 *
 * Normas baseadas em:
 *  Malloy-Diniz et al. (2007) — amostra brasileira
 *
 * ATENÇÃO: Os valores normativos abaixo são estimativas simplificadas.
 * Consulte as normas do instrumento validado para interpretação clínica definitiva.
 */

import type { ScoringResult } from "@/types";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface RavltInput {
  trialA1: number;
  trialA2: number;
  trialA3: number;
  trialA4: number;
  trialA5: number;
  trialB1: number;
  recallShort: number;  // A6: recordação imediata após a Lista B
  recallLong: number;   // A7: recordação tardia (20–30 min)
  recognitionHits?: number | null;  // acertos no reconhecimento (max 15)
  recognitionFP?: number | null;    // falsos positivos no reconhecimento (max 15)
  age: number;
}

export interface RavltScores {
  totalLearning: number;           // A1+A2+A3+A4+A5 (max 75)
  learningSlope: number;           // A5 − A1
  proactiveInhibition: number;     // B1 − A1  (negativo = inibição proativa)
  retroactiveInhibition: number;   // A6 − A5  (negativo = inibição retroativa)
  savingsShortPct: number;         // (A6/A5) × 100
  savingsLongPct: number;          // (A7/A5) × 100
  recognitionIndex: number | null; // acertos − falsos positivos

  percentileTotalLearning: number;
  percentileRecallShort: number;
  percentileRecallLong: number;
  percentileRecognition: number | null;

  classificationLearning: string;
  classificationRecallShort: string;
  classificationRecallLong: string;
  interpretation: string;
}

// ─── Tabelas normativas (Malloy-Diniz simplificadas) ─────────────────────────

interface AgeNorm {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

const totalLearningNorms: { test: (age: number) => boolean; norm: AgeNorm }[] = [
  { test: (age) => age < 50,              norm: { p5: 35, p25: 44, p50: 52, p75: 60, p95: 68 } },
  { test: (age) => age >= 50 && age < 65, norm: { p5: 30, p25: 39, p50: 47, p75: 55, p95: 63 } },
  { test: (age) => age >= 65,             norm: { p5: 25, p25: 33, p50: 41, p75: 50, p95: 58 } },
];

const recallShortNorms: { test: (age: number) => boolean; norm: AgeNorm }[] = [
  { test: (age) => age < 50,              norm: { p5: 5,  p25: 8,  p50: 10, p75: 13, p95: 15 } },
  { test: (age) => age >= 50 && age < 65, norm: { p5: 4,  p25: 7,  p50: 9,  p75: 12, p95: 14 } },
  { test: (age) => age >= 65,             norm: { p5: 3,  p25: 5,  p50: 8,  p75: 11, p95: 13 } },
];

// Recall Long usa as mesmas normas que Recall Short
const recallLongNorms = recallShortNorms;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAgeNorm(
  age: number,
  table: { test: (age: number) => boolean; norm: AgeNorm }[]
): AgeNorm | null {
  const entry = table.find((e) => e.test(age));
  return entry ? entry.norm : null;
}

/**
 * Retorna o percentil estimado por interpolação linear entre os pontos
 * p5, p25, p50, p75 e p95 da tabela normativa.
 */
function scoreToPercentile(score: number, norm: AgeNorm): number {
  const anchors: [number, number][] = [
    [norm.p5,  5],
    [norm.p25, 25],
    [norm.p50, 50],
    [norm.p75, 75],
    [norm.p95, 95],
  ];

  // Abaixo do menor âncora
  if (score <= anchors[0][0]) return anchors[0][1];
  // Acima do maior âncora
  if (score >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

  for (let i = 0; i < anchors.length - 1; i++) {
    const [rawLow, pLow] = anchors[i];
    const [rawHigh, pHigh] = anchors[i + 1];
    if (score >= rawLow && score <= rawHigh) {
      const ratio = (score - rawLow) / (rawHigh - rawLow);
      return Math.round(pLow + ratio * (pHigh - pLow));
    }
  }

  return 50; // fallback
}

function classifyPercentile(p: number): string {
  if (p <= 5)  return "Muito Inferior";
  if (p <= 25) return "Inferior";
  if (p <= 75) return "Médio";
  if (p <= 95) return "Superior";
  return "Muito Superior";
}

// ─── Função principal de correção ────────────────────────────────────────────

export function scoreRavlt(input: RavltInput): ScoringResult<RavltScores> {
  const {
    trialA1, trialA2, trialA3, trialA4, trialA5,
    trialB1,
    recallShort,
    recallLong,
    recognitionHits,
    recognitionFP,
    age,
  } = input;

  // ── Escores derivados ────────────────────────────────────────────────────────

  const totalLearning = trialA1 + trialA2 + trialA3 + trialA4 + trialA5;
  const learningSlope = trialA5 - trialA1;
  const proactiveInhibition = trialB1 - trialA1;
  const retroactiveInhibition = recallShort - trialA5;

  const savingsShortPct = trialA5 > 0
    ? Math.round((recallShort / trialA5) * 100 * 10) / 10
    : 0;

  const savingsLongPct = trialA5 > 0
    ? Math.round((recallLong / trialA5) * 100 * 10) / 10
    : 0;

  const recognitionIndex =
    recognitionHits != null && recognitionFP != null
      ? recognitionHits - recognitionFP
      : null;

  // ── Lookup normativo ─────────────────────────────────────────────────────────

  const normLearning = getAgeNorm(age, totalLearningNorms);
  const normShort    = getAgeNorm(age, recallShortNorms);
  const normLong     = getAgeNorm(age, recallLongNorms);

  const percentileTotalLearning = normLearning
    ? scoreToPercentile(totalLearning, normLearning)
    : 50;

  const percentileRecallShort = normShort
    ? scoreToPercentile(recallShort, normShort)
    : 50;

  const percentileRecallLong = normLong
    ? scoreToPercentile(recallLong, normLong)
    : 50;

  // Para o índice de reconhecimento, usamos uma escala simples:
  // max teórico = 15, corrigimos pela fórmula hits−FP; percentil simplificado
  const percentileRecognition: number | null =
    recognitionIndex != null
      ? Math.min(99, Math.max(1, Math.round(((recognitionIndex + 15) / 30) * 98 + 1)))
      : null;

  // ── Classificações ───────────────────────────────────────────────────────────

  const classificationLearning   = classifyPercentile(percentileTotalLearning);
  const classificationRecallShort = classifyPercentile(percentileRecallShort);
  const classificationRecallLong  = classifyPercentile(percentileRecallLong);

  // ── Interpretação ────────────────────────────────────────────────────────────

  const parts: string[] = [];

  parts.push(
    `Aprendizagem Total (A1–A5): ${totalLearning}/75 ` +
    `(percentil estimado: ${percentileTotalLearning} — ${classificationLearning}).`
  );

  parts.push(
    `Curva de aprendizagem: ${trialA1}→${trialA2}→${trialA3}→${trialA4}→${trialA5} ` +
    `(ganho A5−A1: ${learningSlope > 0 ? "+" : ""}${learningSlope}).`
  );

  parts.push(
    `Inibição proativa (B1−A1): ${proactiveInhibition > 0 ? "+" : ""}${proactiveInhibition}.`
  );

  parts.push(
    `Inibição retroativa (A6−A5): ${retroactiveInhibition > 0 ? "+" : ""}${retroactiveInhibition}. ` +
    `Recordação imediata (A6): ${recallShort} ` +
    `(percentil: ${percentileRecallShort} — ${classificationRecallShort}; ` +
    `retenção: ${savingsShortPct}%).`
  );

  parts.push(
    `Recordação tardia (A7): ${recallLong} ` +
    `(percentil: ${percentileRecallLong} — ${classificationRecallLong}; ` +
    `retenção: ${savingsLongPct}%).`
  );

  if (recognitionIndex != null) {
    parts.push(
      `Reconhecimento: ${recognitionHits} acertos, ${recognitionFP} falsos positivos ` +
      `(índice: ${recognitionIndex}).`
    );
  }

  parts.push(
    "Os valores normativos são estimativas baseadas em estudos com amostras brasileiras " +
    "(Malloy-Diniz et al.). Consulte as normas do instrumento validado para interpretação " +
    "clínica definitiva."
  );

  return {
    scores: {
      totalLearning,
      learningSlope,
      proactiveInhibition,
      retroactiveInhibition,
      savingsShortPct,
      savingsLongPct,
      recognitionIndex,
      percentileTotalLearning,
      percentileRecallShort,
      percentileRecallLong,
      percentileRecognition,
      classificationLearning,
      classificationRecallShort,
      classificationRecallLong,
      interpretation: parts.join(" "),
    },
  };
}
