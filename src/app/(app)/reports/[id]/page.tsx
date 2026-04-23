import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, calculateAge } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

interface Props { params: Promise<{ id: string }> }

// ─── helpers ─────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-1 pr-4 text-xs font-medium text-gray-500 whitespace-nowrap w-56">{label}</td>
      <td className="py-1 text-xs text-gray-900">{value}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-700 border-b border-indigo-200 pb-1 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TestBlock({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 break-inside-avoid">
      <h4 className="text-sm font-bold text-gray-800 mb-0.5">{title}</h4>
      {description && <p className="text-[11px] text-gray-500 mb-2">{description}</p>}
      <table className="w-full"><tbody>{children}</tbody></table>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ReportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: evaluationId } = await params;

  const ev = await prisma.evaluation.findFirst({
    where: { id: evaluationId, userId: session.user.id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          dateOfBirth: true,
          educationLevel: true,
          anamneses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              mainComplaint: true,
              clinicalObservations: true,
              behaviorDuringSession: true,
              medicalHistory: true,
              currentMedications: true,
            },
          },
        },
      },
      testWasi:         true,
      testMoca:         true,
      testRavlt:        true,
      testRey:          true,
      testBpa2:         true,
      testFdt:          true,
      testTmt:          true,
      testCtp:          true,
      testWcst:         true,
      testTorreLondres: true,
      testFluencia:     true,
      testBdi2:         true,
      testBai:          true,
      testAsrs18:       true,
      testDiva2:        true,
      testCaars:        true,
      testMfft:         true,
      testBfp:          true,
      testFauxPas:      true,
    },
  }).catch(() => null);

  if (!ev) {
    // Fallback without new tables if they don't exist yet
    const base = await prisma.evaluation.findFirst({
      where: { id: evaluationId, userId: session.user.id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            educationLevel: true,
            anamneses: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                mainComplaint: true,
                clinicalObservations: true,
                behaviorDuringSession: true,
                medicalHistory: true,
                currentMedications: true,
              },
            },
          },
        },
        testWasi:     true,
        testMoca:     true,
        testRavlt:    true,
        testRey:      true,
        testBpa2:     true,
        testFdt:      true,
        testTmt:      true,
        testBdi2:     true,
        testBai:      true,
        testAsrs18:   true,
        testFluencia: true,
        testBfp:      true,
      },
    });
    if (!base) notFound();
    const fallback = { ...base, testCtp: null, testWcst: null, testTorreLondres: null, testDiva2: null, testCaars: null, testMfft: null, testFauxPas: null };
    return renderReport(fallback as EvalWithTests, session.user?.name ?? "");
  }

  return renderReport(ev, session.user?.name ?? "");
}

// ─── renderReport ─────────────────────────────────────────────────────────────

type EvalWithTests = Awaited<ReturnType<typeof prisma.evaluation.findFirst>> & {
  patient: {
    id: string;
    fullName: string;
    dateOfBirth: Date | null;
    educationLevel: string | null;
    anamneses: { mainComplaint: string | null; clinicalObservations: string | null; behaviorDuringSession: string | null; medicalHistory: string | null; currentMedications: string | null }[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

function renderReport(ev: EvalWithTests, psychologistName: string) {
  if (!ev) return null;

  const patient = ev.patient;
  const anamnesis = patient.anamneses[0] ?? null;
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  const instrumentsUsed: string[] = [];
  if (ev.testWasi)         instrumentsUsed.push("WASI — Escala Wechsler Abreviada de Inteligência");
  if (ev.testMoca)         instrumentsUsed.push("MoCA — Montreal Cognitive Assessment");
  if (ev.testRavlt)        instrumentsUsed.push("RAVLT — Aprendizagem Auditivo-Verbal de Rey");
  if (ev.testRey)          instrumentsUsed.push("Figura Complexa de Rey");
  if (ev.testBpa2)         instrumentsUsed.push("BPA-2 — Bateria de Provas de Atenção");
  if (ev.testFdt)          instrumentsUsed.push("FDT — Five Digit Test");
  if (ev.testTmt)          instrumentsUsed.push("TMT A/B — Trail Making Test");
  if (ev.testCtp)          instrumentsUsed.push("CTP — Teste de Performance Contínua");
  if (ev.testWcst)         instrumentsUsed.push("WCST — Wisconsin Card Sorting Test");
  if (ev.testTorreLondres) instrumentsUsed.push("Torre de Londres");
  if (ev.testFluencia)     instrumentsUsed.push("Fluência Verbal Fonêmica (FAS) e Semântica");
  if (ev.testBdi2)         instrumentsUsed.push("BDI-II — Inventário de Depressão de Beck");
  if (ev.testBai)          instrumentsUsed.push("BAI — Inventário de Ansiedade de Beck");
  if (ev.testAsrs18)       instrumentsUsed.push("ASRS-18 — Adult ADHD Self-Report Scale");
  if (ev.testDiva2)        instrumentsUsed.push("DIVA 2.0 — Entrevista Diagnóstica para TDAH");
  if (ev.testCaars)        instrumentsUsed.push("CAARS — Conners' Adult ADHD Rating Scales");
  if (ev.testMfft)         instrumentsUsed.push("MFFT-BR — Matching Familiar Figures Test");
  if (ev.testBfp)          instrumentsUsed.push("BFP — Bateria Fatorial de Personalidade");
  if (ev.testFauxPas)      instrumentsUsed.push("Teste de Faux Pas — Teoria da Mente");

  return (
    <div className="max-w-3xl space-y-4">

      {/* ── Navigation (hidden on print) ─────────────────────────── */}
      <div className="print:hidden flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/reports" className="hover:text-primary">Laudos</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{patient.fullName}</span>
        </div>
        <PrintButton />
      </div>

      {/* ── Print area ───────────────────────────────────────────── */}
      <div className="bg-white text-gray-900 p-8 print:p-6 rounded-lg border print:border-0 print:shadow-none shadow-sm font-serif">

        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h1 className="text-lg font-bold uppercase tracking-widest">
            Laudo de Avaliação Neuropsicológica
          </h1>
        </div>

        {/* Identification */}
        <Section title="Dados de Identificação">
          <table className="w-full">
            <tbody>
              <Row label="Paciente"      value={patient.fullName} />
              <Row label="Data de Nasc." value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : undefined} />
              <Row label="Idade"         value={age !== null ? `${age} anos` : undefined} />
              <Row label="Escolaridade"  value={patient.educationLevel ?? undefined} />
              <Row label="Avaliação"     value={ev.title} />
              <Row label="Data de Início" value={formatDate(ev.createdAt)} />
            </tbody>
          </table>
        </Section>

        {/* Queixa principal */}
        {anamnesis?.mainComplaint && (
          <Section title="Queixa Principal">
            <p className="text-xs leading-relaxed text-gray-800">{anamnesis.mainComplaint}</p>
          </Section>
        )}

        {/* História clínica relevante */}
        {(anamnesis?.medicalHistory || anamnesis?.currentMedications) && (
          <Section title="História Clínica">
            {anamnesis.medicalHistory && (
              <p className="text-xs leading-relaxed text-gray-800 mb-2">
                <span className="font-semibold">Histórico médico: </span>{anamnesis.medicalHistory}
              </p>
            )}
            {anamnesis.currentMedications && (
              <p className="text-xs leading-relaxed text-gray-800">
                <span className="font-semibold">Medicações em uso: </span>{anamnesis.currentMedications}
              </p>
            )}
          </Section>
        )}

        {/* Observações de comportamento */}
        {(anamnesis?.behaviorDuringSession || anamnesis?.clinicalObservations) && (
          <Section title="Observações Comportamentais">
            {anamnesis.behaviorDuringSession && (
              <p className="text-xs leading-relaxed text-gray-800 mb-2">
                <span className="font-semibold">Comportamento durante a sessão: </span>{anamnesis.behaviorDuringSession}
              </p>
            )}
            {anamnesis.clinicalObservations && (
              <p className="text-xs leading-relaxed text-gray-800">
                <span className="font-semibold">Observações clínicas: </span>{anamnesis.clinicalObservations}
              </p>
            )}
          </Section>
        )}

        {/* Instruments used */}
        {instrumentsUsed.length > 0 && (
          <Section title="Instrumentos Utilizados">
            <ul className="list-disc list-inside space-y-0.5">
              {instrumentsUsed.map((inst) => (
                <li key={inst} className="text-xs text-gray-800">{inst}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────── */}
        <Section title="Resultados">

          {/* WASI */}
          {ev.testWasi && (
            <TestBlock title="WASI — Escala Wechsler Abreviada de Inteligência" description="Estimativa de QI verbal, de execução e total.">
              <Row label="QI Total"         value={ev.testWasi.qiTotal      !== null ? `${ev.testWasi.qiTotal} — ${ev.testWasi.qiTotalClassification}` : undefined} />
              <Row label="QI Verbal"        value={ev.testWasi.qiVerbal     !== null ? `${ev.testWasi.qiVerbal} — ${ev.testWasi.qiVerbalClassification}` : undefined} />
              <Row label="QI de Execução"   value={ev.testWasi.qiExecucao   !== null ? `${ev.testWasi.qiExecucao} — ${ev.testWasi.qiExecucaoClassification}` : undefined} />
              <Row label="Vocabulário (T)"  value={ev.testWasi.vocabularioT  ?? undefined} />
              <Row label="Cubos (T)"        value={ev.testWasi.cubosT        ?? undefined} />
              <Row label="Semelhanças (T)"  value={ev.testWasi.semelhancasT  ?? undefined} />
              <Row label="Raciocínio Matricial (T)" value={ev.testWasi.raciocMatricialT ?? undefined} />
            </TestBlock>
          )}

          {/* MoCA */}
          {ev.testMoca && (
            <TestBlock title="MoCA — Montreal Cognitive Assessment" description="Triagem cognitiva global (máx. 30 pontos). Ponto de corte: ≥ 26 = Normal.">
              <Row label="Escore Total"      value={`${ev.testMoca.totalScore}/30`} />
              <Row label="Bônus escolaridade" value={ev.testMoca.educationBonus ? "Sim (+1)" : "Não"} />
              <Row label="Escore Ajustado"   value={`${ev.testMoca.adjustedScore}/30`} />
              <Row label="Classificação"     value={ev.testMoca.classification} />
              <Row label="Visuoespacial"     value={`${ev.testMoca.visuospatial}/5`} />
              <Row label="Nomeação"          value={`${ev.testMoca.naming}/3`} />
              <Row label="Atenção"           value={`${ev.testMoca.attention}/6`} />
              <Row label="Linguagem"         value={`${ev.testMoca.language}/3`} />
              <Row label="Abstração"         value={`${ev.testMoca.abstraction}/2`} />
              <Row label="Evocação"          value={`${ev.testMoca.recall}/5`} />
              <Row label="Orientação"        value={`${ev.testMoca.orientation}/6`} />
            </TestBlock>
          )}

          {/* RAVLT */}
          {ev.testRavlt && (
            <TestBlock title="RAVLT — Aprendizagem Auditivo-Verbal de Rey" description="Memória verbal de curto e longo prazo.">
              <Row label="Ensaio A1"             value={ev.testRavlt.trialA1} />
              <Row label="Ensaio A2"             value={ev.testRavlt.trialA2} />
              <Row label="Ensaio A3"             value={ev.testRavlt.trialA3} />
              <Row label="Ensaio A4"             value={ev.testRavlt.trialA4} />
              <Row label="Ensaio A5"             value={ev.testRavlt.trialA5} />
              <Row label="Lista B (interferência)" value={ev.testRavlt.trialB1} />
              <Row label="Aprendizagem Total (A1-A5)" value={ev.testRavlt.totalLearning !== null ? `${ev.testRavlt.totalLearning} — ${ev.testRavlt.classificationLearning ?? ""}` : undefined} />
              <Row label="Evocação Imediata (A6)"  value={ev.testRavlt.recallShort !== null ? `${ev.testRavlt.recallShort} — ${ev.testRavlt.classificationRecallShort ?? ""}` : undefined} />
              <Row label="Evocação Tardia (A7)"    value={ev.testRavlt.recallLong  !== null ? `${ev.testRavlt.recallLong} — ${ev.testRavlt.classificationRecallLong ?? ""}` : undefined} />
              <Row label="Reconhecimento"          value={ev.testRavlt.recognitionHits !== null ? `${ev.testRavlt.recognitionHits} acertos, ${ev.testRavlt.recognitionFP ?? 0} FP` : undefined} />
              {ev.testRavlt.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testRavlt.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* Rey */}
          {ev.testRey && (
            <TestBlock title="Figura Complexa de Rey" description="Memória visuoespacial e organização perceptual.">
              <Row label="Cópia"         value={`${ev.testRey.copyScore}/36 — ${ev.testRey.copyClassification}`} />
              <Row label="Evocação"      value={`${ev.testRey.recallScore}/36 — ${ev.testRey.recallClassification}`} />
              <Row label="Retenção"      value={`${ev.testRey.savings.toFixed(1)}%`} />
              {ev.testRey.copyTime   && <Row label="Tempo Cópia"    value={`${ev.testRey.copyTime}s`} />}
              {ev.testRey.recallTime && <Row label="Tempo Evocação" value={`${ev.testRey.recallTime}s`} />}
            </TestBlock>
          )}

          {/* BPA-2 */}
          {ev.testBpa2 && (
            <TestBlock title="BPA-2 — Bateria de Provas de Atenção" description="Atenção concentrada, dividida e alternada.">
              <Row label="At. Concentrada — Acertos/Erros" value={`${ev.testBpa2.concentradaAcertos} acertos / ${ev.testBpa2.concentradaErros} erros`} />
              <Row label="At. Concentrada — PB/Percentil"  value={ev.testBpa2.concentradaPB !== null ? `PB ${ev.testBpa2.concentradaPB} / P${ev.testBpa2.concentradaPercentile} — ${ev.testBpa2.concentradaClassification}` : undefined} />
              <Row label="At. Dividida — Acertos/Erros"    value={`${ev.testBpa2.divididaAcertos} acertos / ${ev.testBpa2.divididaErros} erros`} />
              <Row label="At. Dividida — PB/Percentil"     value={ev.testBpa2.divididaPB !== null ? `PB ${ev.testBpa2.divididaPB} / P${ev.testBpa2.divididaPercentile} — ${ev.testBpa2.divididaClassification}` : undefined} />
              <Row label="At. Alternada — Acertos/Erros"   value={`${ev.testBpa2.alternadaAcertos} acertos / ${ev.testBpa2.alternadaErros} erros`} />
              <Row label="At. Alternada — PB/Percentil"    value={ev.testBpa2.alternadaPB !== null ? `PB ${ev.testBpa2.alternadaPB} / P${ev.testBpa2.alternadaPercentile} — ${ev.testBpa2.alternadaClassification}` : undefined} />
            </TestBlock>
          )}

          {/* FDT */}
          {ev.testFdt && (
            <TestBlock title="FDT — Five Digit Test" description="Velocidade de processamento, inibição e flexibilidade cognitiva.">
              <Row label="Leitura"      value={`${ev.testFdt.leituraTime}s / ${ev.testFdt.leituraErrors} erros${ev.testFdt.leituraClassification ? ` — ${ev.testFdt.leituraClassification}` : ""}`} />
              <Row label="Contagem"     value={`${ev.testFdt.contagemTime}s / ${ev.testFdt.contagemErrors} erros${ev.testFdt.contagemClassification ? ` — ${ev.testFdt.contagemClassification}` : ""}`} />
              <Row label="Escolha"      value={`${ev.testFdt.escolhaTime}s / ${ev.testFdt.escolhaErrors} erros${ev.testFdt.escolhaClassification ? ` — ${ev.testFdt.escolhaClassification}` : ""}`} />
              <Row label="Alternância"  value={`${ev.testFdt.alternanciaTime}s / ${ev.testFdt.alternanciaErrors} erros${ev.testFdt.alternanciaClassification ? ` — ${ev.testFdt.alternanciaClassification}` : ""}`} />
              <Row label="Inibição (5−3)" value={ev.testFdt.inhibitionScore !== null ? `${ev.testFdt.inhibitionScore?.toFixed(1)}s${ev.testFdt.inhibitionClassification ? ` — ${ev.testFdt.inhibitionClassification}` : ""}` : undefined} />
              <Row label="Flexibilidade (4−3)" value={ev.testFdt.flexibilityScore !== null ? `${ev.testFdt.flexibilityScore?.toFixed(1)}s${ev.testFdt.flexibilityClassification ? ` — ${ev.testFdt.flexibilityClassification}` : ""}` : undefined} />
            </TestBlock>
          )}

          {/* TMT */}
          {ev.testTmt && (
            <TestBlock title="TMT A/B — Trail Making Test" description="Atenção seletiva (Parte A) e funções executivas / flexibilidade (Parte B).">
              <Row label="Parte A — Tempo"  value={`${ev.testTmt.partATime}s / ${ev.testTmt.partAErrors} erros — ${ev.testTmt.partAClassification}`} />
              <Row label="Parte B — Tempo"  value={`${ev.testTmt.partBTime}s / ${ev.testTmt.partBErrors} erros — ${ev.testTmt.partBClassification}`} />
              <Row label="Razão B/A"        value={ev.testTmt.ratio.toFixed(2)} />
            </TestBlock>
          )}

          {/* CTP */}
          {ev.testCtp && (
            <TestBlock title="CTP — Teste de Performance Contínua" description="Atenção sustentada, impulsividade e vigilância.">
              <Row label="Acertos"           value={`${ev.testCtp.hits}/${ev.testCtp.totalTargets} (${ev.testCtp.hitRate.toFixed(1)}%) — ${ev.testCtp.hitRateClass}`} />
              <Row label="Omissões"          value={`${ev.testCtp.omissions} (${ev.testCtp.omissionRate.toFixed(1)}%)`} />
              <Row label="Comissões"         value={`${ev.testCtp.commissions} (${ev.testCtp.commissionRate.toFixed(1)}%)`} />
              <Row label="TR Médio"          value={`${ev.testCtp.meanHitRT.toFixed(1)} ms — ${ev.testCtp.rtClass}`} />
              <Row label="Variabilidade (SE)" value={`${ev.testCtp.hitRTse.toFixed(1)} ms — ${ev.testCtp.variabilityClass}`} />
              {ev.testCtp.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testCtp.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* WCST */}
          {ev.testWcst && (
            <TestBlock title="WCST — Wisconsin Card Sorting Test" description="Flexibilidade cognitiva, raciocínio abstrato e controle inibitório.">
              <Row label="Categorias Completadas"       value={`${ev.testWcst.categoriesCompleted} — ${ev.testWcst.categoriesClass}`} />
              <Row label="Erros Perseverativos"         value={`${ev.testWcst.perseverativeErrors} (${ev.testWcst.perseverativeErrorsPct.toFixed(1)}%) — ${ev.testWcst.perseverativeClass}`} />
              <Row label="Erros Não-Perseverativos"     value={`${ev.testWcst.nonPerseverativeErrors}`} />
              <Row label="Respostas Nível Conceitual"   value={`${ev.testWcst.conceptualLevelResponses} (${ev.testWcst.conceptualLevelPct.toFixed(1)}%) — ${ev.testWcst.errorsClass}`} />
              <Row label="Total de Tentativas"          value={ev.testWcst.totalTrials} />
              {ev.testWcst.trialsFirstCategory !== null && <Row label="Tentativas 1ª Categoria" value={ev.testWcst.trialsFirstCategory ?? undefined} />}
              {ev.testWcst.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testWcst.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* Torre de Londres */}
          {ev.testTorreLondres && (
            <TestBlock title="Torre de Londres" description="Planejamento, resolução de problemas e controle executivo.">
              <Row label="Soluções Corretas"    value={`${ev.testTorreLondres.correctSolutions}/${ev.testTorreLondres.totalProblems} (${ev.testTorreLondres.accuracyPct.toFixed(1)}%) — ${ev.testTorreLondres.totalScoreClass}`} />
              <Row label="Movimentos Totais"    value={ev.testTorreLondres.totalMoves} />
              <Row label="Violações de Regra"   value={ev.testTorreLondres.ruleViolations} />
              <Row label="Tempo Total"          value={`${ev.testTorreLondres.totalTime.toFixed(1)}s`} />
              <Row label="Tempo de Iniciação"   value={`${ev.testTorreLondres.meanInitiationTime.toFixed(1)}s (média)`} />
              <Row label="Tempo de Execução"    value={`${ev.testTorreLondres.meanExecutionTime.toFixed(1)}s (média) — ${ev.testTorreLondres.executionClass}`} />
              {ev.testTorreLondres.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testTorreLondres.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* Fluência Verbal */}
          {ev.testFluencia && (
            <TestBlock title="Fluência Verbal" description="Fluência fonêmica (FAS) e semântica (animais).">
              <Row label="FAS Total (F+A+S)"    value={`${ev.testFluencia.fasTotal} — ${ev.testFluencia.fasClassification}`} />
              <Row label="F / A / S"            value={`${ev.testFluencia.fasF} / ${ev.testFluencia.fasA} / ${ev.testFluencia.fasS}`} />
              <Row label="Animais"              value={`${ev.testFluencia.animais} — ${ev.testFluencia.animaisClassification}`} />
            </TestBlock>
          )}

          {/* BDI-II */}
          {ev.testBdi2 && (
            <TestBlock title="BDI-II — Inventário de Depressão de Beck" description="Autoavaliação de sintomas depressivos (21 itens, 0–63).">
              <Row label="Escore Total"  value={`${ev.testBdi2.totalScore}`} />
              <Row label="Classificação" value={ev.testBdi2.classification} />
            </TestBlock>
          )}

          {/* BAI */}
          {ev.testBai && (
            <TestBlock title="BAI — Inventário de Ansiedade de Beck" description="Autoavaliação de sintomas ansiosos (21 itens, 0–63).">
              <Row label="Escore Total"  value={`${ev.testBai.totalScore}`} />
              <Row label="Classificação" value={ev.testBai.classification} />
            </TestBlock>
          )}

          {/* ASRS-18 */}
          {ev.testAsrs18 && (
            <TestBlock title="ASRS-18 — Adult ADHD Self-Report Scale" description="Rastreio de TDAH em adultos (18 itens DSM-5).">
              <Row label="Parte A (6 itens)"   value={ev.testAsrs18.partAPositiveItems !== null ? `${ev.testAsrs18.partAPositiveItems} itens positivos (escore: ${ev.testAsrs18.scorePartA})` : undefined} />
              <Row label="Parte B (12 itens)"  value={ev.testAsrs18.partBPositiveItems !== null ? `${ev.testAsrs18.partBPositiveItems} itens positivos (escore: ${ev.testAsrs18.scorePartB})` : undefined} />
              <Row label="Total"               value={ev.testAsrs18.totalScore ?? undefined} />
              <Row label="Significância Clínica" value={ev.testAsrs18.clinicalSignificant !== null ? (ev.testAsrs18.clinicalSignificant ? "Positivo — rastreio sugestivo de TDAH" : "Negativo") : undefined} />
              {ev.testAsrs18.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testAsrs18.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* DIVA 2.0 */}
          {ev.testDiva2 && (
            <TestBlock title="DIVA 2.0 — Entrevista Diagnóstica para TDAH (DSM-5)" description="Entrevista estruturada para diagnóstico retrospectivo e atual de TDAH.">
              <Row label="Desatenção — fase adulta"   value={`${ev.testDiva2.iaAdultCount}/9 critérios (${ev.testDiva2.meetsIaAdult ? "atende ≥5" : "não atende"})`} />
              <Row label="HI — fase adulta"           value={`${ev.testDiva2.hiAdultCount}/9 critérios (${ev.testDiva2.meetsHiAdult ? "atende ≥5" : "não atende"})`} />
              <Row label="Desatenção — infância"      value={`${ev.testDiva2.iaChildCount}/9 critérios (${ev.testDiva2.meetsIaChild ? "atende ≥6" : "não atende"})`} />
              <Row label="HI — infância"              value={`${ev.testDiva2.hiChildCount}/9 critérios (${ev.testDiva2.meetsHiChild ? "atende ≥6" : "não atende"})`} />
              <Row label="Diagnóstico DIVA"           value={ev.testDiva2.diagnosis} />
            </TestBlock>
          )}

          {/* CAARS */}
          {ev.testCaars && (
            <TestBlock title="CAARS — Conners&apos; Adult ADHD Rating Scales" description="Escalas de rastreio de TDAH em adultos (escores T, média=50, DP=10).">
              <Row label="Índice de TDAH (T)"         value={`${ev.testCaars.adhdIndexT} — ${ev.testCaars.adhdIndexClass}`} />
              <Row label="Desatenção (T)"             value={`${ev.testCaars.inattentionT} — ${ev.testCaars.inattentionClass}`} />
              <Row label="Hiperatividade (T)"         value={`${ev.testCaars.hyperactivityT} — ${ev.testCaars.hyperactivityClass}`} />
              <Row label="Impulsividade (T)"          value={`${ev.testCaars.impulsivityT} — ${ev.testCaars.impulsivityClass}`} />
              <Row label="Auto-Conceito (T)"          value={`${ev.testCaars.selfConceptT} — ${ev.testCaars.selfConceptClass}`} />
              <Row label="DSM-IA (T)"                 value={`${ev.testCaars.dsmInattentionT} — ${ev.testCaars.dsmInattentionClass}`} />
              <Row label="DSM-HI (T)"                 value={`${ev.testCaars.dsmHyperactivityT} — ${ev.testCaars.dsmHyperactivityClass}`} />
              {ev.testCaars.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testCaars.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* MFFT-BR */}
          {ev.testMfft && (
            <TestBlock title="MFFT-BR — Matching Familiar Figures Test" description="Estilo cognitivo reflexivo/impulsivo.">
              <Row label="Erros Totais"         value={ev.testMfft.totalErrors} />
              <Row label="Latência Média"       value={`${ev.testMfft.meanLatency.toFixed(2)}s`} />
              <Row label="Índice de Impulsividade" value={ev.testMfft.impulsivityIndex.toFixed(2)} />
              <Row label="Classificação"        value={ev.testMfft.classification} />
              {ev.testMfft.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testMfft.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {/* BFP */}
          {ev.testBfp && (
            <TestBlock title="BFP — Bateria Fatorial de Personalidade" description="Avaliação dos Cinco Grandes Fatores de Personalidade.">
              <Row label="Neuroticismo"  value={ev.testBfp.percentileNeuroticismo !== null ? `P${ev.testBfp.percentileNeuroticismo} — ${ev.testBfp.classificationNeuroticismo}` : undefined} />
              <Row label="Extroversão"   value={ev.testBfp.percentileExtroversao  !== null ? `P${ev.testBfp.percentileExtroversao} — ${ev.testBfp.classificationExtroversao}` : undefined} />
              <Row label="Socialização"  value={ev.testBfp.percentileSocializacao !== null ? `P${ev.testBfp.percentileSocializacao} — ${ev.testBfp.classificationSocializacao}` : undefined} />
              <Row label="Realização"    value={ev.testBfp.percentileRealizacao   !== null ? `P${ev.testBfp.percentileRealizacao} — ${ev.testBfp.classificationRealizacao}` : undefined} />
              <Row label="Abertura"      value={ev.testBfp.percentileAbertura     !== null ? `P${ev.testBfp.percentileAbertura} — ${ev.testBfp.classificationAbertura}` : undefined} />
            </TestBlock>
          )}

          {/* Faux Pas */}
          {ev.testFauxPas && (
            <TestBlock title="Teste de Faux Pas — Teoria da Mente" description="Cognição social e Teoria da Mente (ToM). 10 histórias c/ faux pas + 10 controle.">
              <Row label="Total Geral"      value={`${ev.testFauxPas.totalScore}/40 — ${ev.testFauxPas.classification}`} />
              <Row label="Índice ToM"       value={`${ev.testFauxPas.fauxPasIndex.toFixed(1)}%`} />
              <Row label="Detecção"         value={`${ev.testFauxPas.detectionScore}/10`} />
              <Row label="Compreensão"      value={`${ev.testFauxPas.understandingScore}/10`} />
              <Row label="Empatia"          value={`${ev.testFauxPas.empathyScore}/10`} />
              <Row label="Controle"         value={`${ev.testFauxPas.controlScore}/10`} />
              {ev.testFauxPas.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-800 italic">{ev.testFauxPas.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

        </Section>

        {/* Signature area */}
        <div className="mt-10 pt-6 border-t border-gray-300 flex flex-col items-center gap-1">
          <div className="w-56 border-t border-gray-800 pt-2 text-center">
            <p className="text-xs font-semibold">{psychologistName || "Psicólogo(a)"}</p>
            <p className="text-[10px] text-gray-500">Psicólogo(a) Neuropsicólogo(a)</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Laudo gerado em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

      </div>

      {/* Bottom print button */}
      <div className="print:hidden flex justify-end pb-8">
        <PrintButton />
      </div>

    </div>
  );
}
