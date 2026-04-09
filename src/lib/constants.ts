/**
 * Constantes de UI compartilhadas entre páginas.
 * Centraliza labels, variantes e opções de select para evitar duplicação.
 */

// ─── Status de Avaliação ──────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  IN_PROGRESS: {
    label: "Em andamento",
    variant: "warning" as const,
  },
  COMPLETED: {
    label: "Concluída",
    variant: "secondary" as const,
  },
  REPORT_GENERATED: {
    label: "Laudo gerado",
    variant: "success" as const,
  },
} as const;

export type EvaluationStatusKey = keyof typeof STATUS_CONFIG;

// ─── Opções de Select para Formulários ───────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: "MALE",   label: "Masculino" },
  { value: "FEMALE", label: "Feminino" },
  { value: "OTHER",  label: "Outro" },
] as const;

export const EDUCATION_OPTIONS = [
  { value: "NO_FORMAL_EDUCATION",    label: "Sem escolaridade" },
  { value: "INCOMPLETE_ELEMENTARY",  label: "Fundamental incompleto" },
  { value: "COMPLETE_ELEMENTARY",    label: "Fundamental completo" },
  { value: "INCOMPLETE_HIGH_SCHOOL", label: "Médio incompleto" },
  { value: "COMPLETE_HIGH_SCHOOL",   label: "Médio completo" },
  { value: "INCOMPLETE_HIGHER",      label: "Superior incompleto" },
  { value: "COMPLETE_HIGHER",        label: "Superior completo" },
  { value: "POSTGRADUATE",           label: "Pós-graduação" },
] as const;

// Enum de valores extraído das opções (usado nos schemas Zod)
export const EDUCATION_VALUES = EDUCATION_OPTIONS.map((o) => o.value) as [
  "NO_FORMAL_EDUCATION",
  "INCOMPLETE_ELEMENTARY",
  "COMPLETE_ELEMENTARY",
  "INCOMPLETE_HIGH_SCHOOL",
  "COMPLETE_HIGH_SCHOOL",
  "INCOMPLETE_HIGHER",
  "COMPLETE_HIGHER",
  "POSTGRADUATE"
];

export const GENDER_VALUES = GENDER_OPTIONS.map((o) => o.value) as [
  "MALE",
  "FEMALE",
  "OTHER"
];

