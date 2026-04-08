import { EducationLevel, EvaluationStatus, Gender } from "@/generated/prisma";

// ─── Re-exports de Prisma ─────────────────────────────────────────────────────

export { EducationLevel, EvaluationStatus, Gender };

// ─── Labels para UI ───────────────────────────────────────────────────────────

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Masculino",
  FEMALE: "Feminino",
  OTHER: "Outro",
};

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  NO_FORMAL_EDUCATION: "Sem escolaridade",
  INCOMPLETE_ELEMENTARY: "Fundamental incompleto",
  COMPLETE_ELEMENTARY: "Fundamental completo",
  INCOMPLETE_HIGH_SCHOOL: "Médio incompleto",
  COMPLETE_HIGH_SCHOOL: "Médio completo",
  INCOMPLETE_HIGHER: "Superior incompleto",
  COMPLETE_HIGHER: "Superior completo",
  POSTGRADUATE: "Pós-graduação",
};

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  REPORT_GENERATED: "Laudo gerado",
};

// ─── Grupos de Escolaridade para Tabelas Normativas ──────────────────────────

export type EducationGroup = "low" | "medium" | "high";

export function getEducationGroup(level: EducationLevel): EducationGroup {
  if (
    level === "NO_FORMAL_EDUCATION" ||
    level === "INCOMPLETE_ELEMENTARY" ||
    level === "COMPLETE_ELEMENTARY"
  ) {
    return "low";
  }
  if (level === "INCOMPLETE_HIGH_SCHOOL" || level === "COMPLETE_HIGH_SCHOOL") {
    return "medium";
  }
  return "high";
}

// ─── Classificação por Percentil ─────────────────────────────────────────────

export function classifyPercentile(percentile: number): string {
  if (percentile <= 5) return "Muito Inferior";
  if (percentile <= 25) return "Inferior";
  if (percentile <= 75) return "Médio";
  if (percentile <= 95) return "Superior";
  return "Muito Superior";
}

// ─── Patient Detail (usado em patients/[id]) ─────────────────────────────────

export interface PatientAnamnesisSummary {
  id: string;
  mainComplaint: string;
  createdAt: Date;
}

export interface PatientEvaluationSummary {
  id: string;
  title: string;
  status: EvaluationStatus;
  createdAt: Date;
}

export interface PatientDetail {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  educationLevel: EducationLevel;
  occupation?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: Date;
  anamneses: PatientAnamnesisSummary[];
  evaluations: PatientEvaluationSummary[];
}

// ─── Scoring Result Types ─────────────────────────────────────────────────────

export interface ScoringResult<T> {
  scores: T;
  error?: string;
}

export interface Asrs18Input {
  items: [number, number, number, number, number, number, number, number, number,
          number, number, number, number, number, number, number, number, number];
}

export interface Asrs18Scores {
  scorePartA: number;
  scorePartB: number;
  totalScore: number;
  partAPositiveItems: number;
  partBPositiveItems: number;
  clinicalSignificant: boolean;
  interpretation: string;
}

export interface Bpa2Input {
  concentradaAcertos: number;
  concentradaErros: number;
  divididaAcertos: number;
  divididaErros: number;
  alternadaAcertos: number;
  alternadaErros: number;
  age: number;
  educationLevel: EducationLevel;
}

export interface Bpa2Scores {
  concentradaPB: number;
  divididaPB: number;
  alternadaPB: number;
  concentradaPercentile: number | null;
  divididaPercentile: number | null;
  alternadaPercentile: number | null;
  concentradaClassification: string;
  divididaClassification: string;
  alternadaClassification: string;
}
