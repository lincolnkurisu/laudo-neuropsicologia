-- =============================================================================
-- SCRIPT DE MIGRAÇÃO — Neon PostgreSQL
-- Execute este script completo no console SQL do Neon
-- =============================================================================

-- 1. Adicionar coluna isAdmin ao User (se não existir)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- 2. Promover seu usuário a administrador (ajuste o e-mail se necessário)
-- UPDATE "User" SET "isAdmin" = true WHERE email = 'lincolnkurisu@gmail.com';

-- =============================================================================
-- 3. Tabela TestDiva2
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestDiva2" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  -- Desatenção — fase adulta
  "iaAdult1" BOOLEAN NOT NULL,
  "iaAdult2" BOOLEAN NOT NULL,
  "iaAdult3" BOOLEAN NOT NULL,
  "iaAdult4" BOOLEAN NOT NULL,
  "iaAdult5" BOOLEAN NOT NULL,
  "iaAdult6" BOOLEAN NOT NULL,
  "iaAdult7" BOOLEAN NOT NULL,
  "iaAdult8" BOOLEAN NOT NULL,
  "iaAdult9" BOOLEAN NOT NULL,

  -- Desatenção — infância
  "iaChild1" BOOLEAN NOT NULL,
  "iaChild2" BOOLEAN NOT NULL,
  "iaChild3" BOOLEAN NOT NULL,
  "iaChild4" BOOLEAN NOT NULL,
  "iaChild5" BOOLEAN NOT NULL,
  "iaChild6" BOOLEAN NOT NULL,
  "iaChild7" BOOLEAN NOT NULL,
  "iaChild8" BOOLEAN NOT NULL,
  "iaChild9" BOOLEAN NOT NULL,

  -- Hiperatividade/Impulsividade — fase adulta
  "hiAdult1" BOOLEAN NOT NULL,
  "hiAdult2" BOOLEAN NOT NULL,
  "hiAdult3" BOOLEAN NOT NULL,
  "hiAdult4" BOOLEAN NOT NULL,
  "hiAdult5" BOOLEAN NOT NULL,
  "hiAdult6" BOOLEAN NOT NULL,
  "hiAdult7" BOOLEAN NOT NULL,
  "hiAdult8" BOOLEAN NOT NULL,
  "hiAdult9" BOOLEAN NOT NULL,

  -- Hiperatividade/Impulsividade — infância
  "hiChild1" BOOLEAN NOT NULL,
  "hiChild2" BOOLEAN NOT NULL,
  "hiChild3" BOOLEAN NOT NULL,
  "hiChild4" BOOLEAN NOT NULL,
  "hiChild5" BOOLEAN NOT NULL,
  "hiChild6" BOOLEAN NOT NULL,
  "hiChild7" BOOLEAN NOT NULL,
  "hiChild8" BOOLEAN NOT NULL,
  "hiChild9" BOOLEAN NOT NULL,

  -- Contagens
  "iaAdultCount" INTEGER NOT NULL,
  "iaChildCount" INTEGER NOT NULL,
  "hiAdultCount" INTEGER NOT NULL,
  "hiChildCount" INTEGER NOT NULL,

  -- Critérios atendidos
  "meetsIaAdult" BOOLEAN NOT NULL,
  "meetsHiAdult" BOOLEAN NOT NULL,
  "meetsIaChild" BOOLEAN NOT NULL,
  "meetsHiChild" BOOLEAN NOT NULL,

  "diagnosis" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestDiva2_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 4. Tabela TestCaars
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestCaars" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  "inattentionT"      INTEGER NOT NULL,
  "hyperactivityT"    INTEGER NOT NULL,
  "impulsivityT"      INTEGER NOT NULL,
  "selfConceptT"      INTEGER NOT NULL,
  "dsmInattentionT"   INTEGER NOT NULL,
  "dsmHyperactivityT" INTEGER NOT NULL,
  "adhdIndexT"        INTEGER NOT NULL,

  "inattentionClass"      TEXT NOT NULL,
  "hyperactivityClass"    TEXT NOT NULL,
  "impulsivityClass"      TEXT NOT NULL,
  "selfConceptClass"      TEXT NOT NULL,
  "dsmInattentionClass"   TEXT NOT NULL,
  "dsmHyperactivityClass" TEXT NOT NULL,
  "adhdIndexClass"        TEXT NOT NULL,

  "interpretation" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestCaars_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 5. Tabela TestCtp
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestCtp" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  "hits"         INTEGER NOT NULL,
  "omissions"    INTEGER NOT NULL,
  "commissions"  INTEGER NOT NULL,
  "totalTargets" INTEGER NOT NULL,
  "meanHitRT"    DOUBLE PRECISION NOT NULL,
  "hitRTse"      DOUBLE PRECISION NOT NULL,

  "hitRate"        DOUBLE PRECISION NOT NULL,
  "omissionRate"   DOUBLE PRECISION NOT NULL,
  "commissionRate" DOUBLE PRECISION NOT NULL,

  "hitRateClass"    TEXT NOT NULL,
  "rtClass"         TEXT NOT NULL,
  "variabilityClass" TEXT NOT NULL,

  "interpretation" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestCtp_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 6. Tabela TestWcst
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestWcst" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  "totalTrials"              INTEGER NOT NULL,
  "totalCorrect"             INTEGER NOT NULL,
  "totalErrors"              INTEGER NOT NULL,
  "perseverativeResponses"   INTEGER NOT NULL,
  "perseverativeErrors"      INTEGER NOT NULL,
  "nonPerseverativeErrors"   INTEGER NOT NULL,
  "conceptualLevelResponses" INTEGER NOT NULL,
  "categoriesCompleted"      INTEGER NOT NULL,
  "trialsFirstCategory"      INTEGER,
  "failureMaintainSet"       INTEGER NOT NULL,

  "perseverativeErrorsPct" DOUBLE PRECISION NOT NULL,
  "conceptualLevelPct"     DOUBLE PRECISION NOT NULL,

  "perseverativeClass" TEXT NOT NULL,
  "categoriesClass"    TEXT NOT NULL,
  "errorsClass"        TEXT NOT NULL,

  "interpretation" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestWcst_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 7. Tabela TestTorreLondres
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestTorreLondres" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  "totalProblems"      INTEGER NOT NULL,
  "correctSolutions"   INTEGER NOT NULL,
  "ruleViolations"     INTEGER NOT NULL,
  "totalMoves"         INTEGER NOT NULL,
  "meanInitiationTime" DOUBLE PRECISION NOT NULL,
  "meanExecutionTime"  DOUBLE PRECISION NOT NULL,
  "totalTime"          DOUBLE PRECISION NOT NULL,

  "accuracyPct"     DOUBLE PRECISION NOT NULL,
  "totalScoreClass" TEXT NOT NULL,
  "executionClass"  TEXT NOT NULL,

  "interpretation" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestTorreLondres_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 8. Tabela TestMfft
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestMfft" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  "totalErrors"      INTEGER NOT NULL,
  "meanLatency"      DOUBLE PRECISION NOT NULL,
  "impulsivityIndex" DOUBLE PRECISION NOT NULL,

  "classification" TEXT NOT NULL,
  "interpretation" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestMfft_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 9. Tabela TestFauxPas
-- =============================================================================
CREATE TABLE IF NOT EXISTS "TestFauxPas" (
  "id"           TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL UNIQUE,

  "detectionScore"    INTEGER NOT NULL,
  "understandingScore" INTEGER NOT NULL,
  "empathyScore"      INTEGER NOT NULL,
  "controlScore"      INTEGER NOT NULL,

  "totalScore"    INTEGER NOT NULL,
  "fauxPasIndex"  DOUBLE PRECISION NOT NULL,

  "classification" TEXT NOT NULL,
  "interpretation" TEXT NOT NULL,

  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "TestFauxPas_evaluationId_fkey"
    FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE
);

-- =============================================================================
-- Verificação final — deve retornar 1 linha para cada tabela
-- =============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'TestDiva2','TestCaars','TestCtp','TestWcst',
    'TestTorreLondres','TestMfft','TestFauxPas'
  )
ORDER BY table_name;
