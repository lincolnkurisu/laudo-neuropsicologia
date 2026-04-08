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

// ─── Dados de Demo (removidos das páginas para não recriar por render) ────────

export const MOCK_STATS = {
  totalPatients: 12,
  activeEvaluations: 3,
  completedReports: 8,
  thisMonthEvals: 5,
} as const;

export const MOCK_RECENT_PATIENTS = [
  {
    id: "1",
    fullName: "Ana Beatriz Silva",
    age: 34,
    lastEval: new Date("2026-04-01"),
    status: "IN_PROGRESS" as EvaluationStatusKey,
  },
  {
    id: "2",
    fullName: "Carlos Eduardo Mendes",
    age: 28,
    lastEval: new Date("2026-03-28"),
    status: "COMPLETED" as EvaluationStatusKey,
  },
  {
    id: "3",
    fullName: "Fernanda Costa Lima",
    age: 45,
    lastEval: new Date("2026-03-20"),
    status: "REPORT_GENERATED" as EvaluationStatusKey,
  },
] as const;

export const MOCK_PATIENTS = [
  {
    id: "1",
    fullName: "Ana Beatriz Silva",
    dateOfBirth: new Date("1992-03-15"),
    gender: "FEMALE" as const,
    educationLevel: "COMPLETE_HIGHER" as const,
    occupation: "Professora",
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "2",
    fullName: "Carlos Eduardo Mendes",
    dateOfBirth: new Date("1998-07-22"),
    gender: "MALE" as const,
    educationLevel: "INCOMPLETE_HIGHER" as const,
    occupation: "Estudante",
    createdAt: new Date("2026-03-28"),
  },
  {
    id: "3",
    fullName: "Fernanda Costa Lima",
    dateOfBirth: new Date("1981-11-08"),
    gender: "FEMALE" as const,
    educationLevel: "POSTGRADUATE" as const,
    occupation: "Engenheira",
    createdAt: new Date("2026-03-20"),
  },
];
