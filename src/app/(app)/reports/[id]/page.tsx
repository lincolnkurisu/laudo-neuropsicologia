import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, calculateAge } from "@/lib/utils";
import { EDUCATION_LABELS } from "@/types";
import { PrintButton } from "./PrintButton";

interface Props { params: Promise<{ id: string }> }

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

export default async function ReportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: evaluationId } = await params;

  // 1. Busca a avaliação + paciente SEM nenhum include de teste.
  //    Isso garante que a página sempre carrega mesmo que tabelas de teste
  //    não existam ainda no banco de dados.
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
    },
  });

  if (!ev) notFound();

  // 2. Busca cada teste de forma independente.
  //    Cada .catch(() => null) isola falhas — se uma tabela não existir
  //    no DB, apenas aquele teste fica nulo; os demais continuam funcionando.
  const [
    testWasi, testMoca, testRavlt, testRey, testBpa2, testFdt, testTmt,
    testCtp, testWcst, testTorreLondres, testFluencia, testBdi2, testBai,
    testAsrs18, testDiva2, testCaars, testMfft, testBfp, testFauxPas,
  ] = await Promise.all([
    prisma.testWasi.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testMoca.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testRavlt.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testRey.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testBpa2.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testFdt.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testTmt.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testCtp.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testWcst.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testTorreLondres.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testFluencia.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testBdi2.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testBai.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testAsrs18.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testDiva2.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testCaars.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testMfft.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testBfp.findUnique({ where: { evaluationId } }).catch(() => null),
    prisma.testFauxPas.findUnique({ where: { evaluationId } }).catch(() => null),
  ]);

  const patient = ev.patient;
  const anamnesis = patient.anamneses[0] ?? null;
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
  const educationLabel = patient.educationLevel
    ? (EDUCATION_LABELS[patient.educationLevel as keyof typeof EDUCATION_LABELS] ?? String(patient.educationLevel))
    : null;
  const psychologistName = session.user?.name ?? "";

  const instrumentsUsed: string[] = [];
  if (testWasi)         instrumentsUsed.push("WASI — Escala Wechsler Abreviada de Inteligência");
  if (testMoca)         instrumentsUsed.push("MoCA — Montreal Cognitive Assessment");
  if (testRavlt)        instrumentsUsed.push("RAVLT — Aprendizagem Auditivo-Verbal de Rey");
  if (testRey)          instrumentsUsed.push("Figura Complexa de Rey");
  if (testBpa2)         instrumentsUsed.push("BPA-2 — Bateria de Provas de Atenção");
  if (testFdt)          instrumentsUsed.push("FDT — Five Digit Test");
  if (testTmt)          instrumentsUsed.push("TMT A/B — Trail Making Test");
  if (testCtp)          instrumentsUsed.push("CTP — Teste de Performance Contínua");
  if (testWcst)         instrumentsUsed.push("WCST — Wisconsin Card Sorting Test");
  if (testTorreLondres) instrumentsUsed.push("Torre de Londres");
  if (testFluencia)     instrumentsUsed.push("Fluência Verbal Fonêmica (FAS) e Semântica");
  if (testBdi2)         instrumentsUsed.push("BDI-II — Inventário de Depressão de Beck");
  if (testBai)          instrumentsUsed.push("BAI — Inventário de Ansiedade de Beck");
  if (testAsrs18)       instrumentsUsed.push("ASRS-18 — Adult ADHD Self-Report Scale");
  if (testDiva2)        instrumentsUsed.push("DIVA 2.0 — Entrevista Diagnóstica para TDAH");
  if (testCaars)        instrumentsUsed.push("CAARS — Conners Adult ADHD Rating Scales");
  if (testMfft)         instrumentsUsed.push("MFFT-BR — Matching Familiar Figures Test");
  if (testBfp)          instrumentsUsed.push("BFP — Bateria Fatorial de Personalidade");
  if (testFauxPas)      instrumentsUsed.push("Teste de Faux Pas — Teoria da Mente");

  return (
    <div className="max-w-3xl space-y-4">
      <div className="print:hidden flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/reports" className="hover:text-primary">Laudos</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{patient.fullName}</span>
        </div>
        <PrintButton />
      </div>

      <div className="bg-white text-gray-900 p-8 print:p-6 rounded-lg border print:border-0 print:shadow-none shadow-sm font-serif">

        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h1 className="text-lg font-bold uppercase tracking-widest">
            Laudo de Avaliação Neuropsicológica
          </h1>
        </div>

        <Section title="Dados de Identificação">
          <table className="w-full">
            <tbody>
              <Row label="Paciente"       value={patient.fullName} />
              <Row label="Data de Nasc."  value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : undefined} />
              <Row label="Idade"          value={age !== null ? `${age} anos` : undefined} />
              <Row label="Escolaridade"   value={educationLabel ?? undefined} />
              <Row label="Avaliação"      value={ev.title} />
              <Row label="Data de Início" value={formatDate(ev.createdAt)} />
            </tbody>
          </table>
        </Section>

        {anamnesis?.mainComplaint && (
          <Section title="Queixa Principal">
            <p className="text-xs leading-relaxed text-gray-800">{anamnesis.mainComplaint}</p>
          </Section>
        )}

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

        {(anamnesis?.behaviorDuringSession || anamnesis?.clinicalObservations) && (
          <Section title="Observações Comportamentais">
            {anamnesis.behaviorDuringSession && (
              <p className="text-xs leading-relaxed text-gray-800 mb-2">
                <span className="font-semibold">Comportamento na sessão: </span>{anamnesis.behaviorDuringSession}
              </p>
            )}
            {anamnesis.clinicalObservations && (
              <p className="text-xs leading-relaxed text-gray-800">
                <span className="font-semibold">Observações clínicas: </span>{anamnesis.clinicalObservations}
              </p>
            )}
          </Section>
        )}

        {instrumentsUsed.length > 0 && (
          <Section title="Instrumentos Utilizados">
            <ul className="list-disc list-inside space-y-0.5">
              {instrumentsUsed.map((inst) => (
                <li key={inst} className="text-xs text-gray-800">{inst}</li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Resultados dos Testes">
          {instrumentsUsed.length === 0 && (
            <p className="text-xs text-gray-500 italic">Nenhum teste aplicado registrado nesta avaliação.</p>
          )}

          {testWasi && (
            <TestBlock title="WASI — Escala Wechsler Abreviada de Inteligência" description="Estimativa de QI verbal, de execução e total.">
              <Row label="QI Total"                 value={testWasi.qiTotal != null ? `${testWasi.qiTotal} — ${testWasi.qiTotalClassification ?? ""}` : undefined} />
              <Row label="QI Verbal"                value={testWasi.qiVerbal != null ? `${testWasi.qiVerbal} — ${testWasi.qiVerbalClassification ?? ""}` : undefined} />
              <Row label="QI de Execução"           value={testWasi.qiExecucao != null ? `${testWasi.qiExecucao} — ${testWasi.qiExecucaoClassification ?? ""}` : undefined} />
              <Row label="Vocabulário (T)"          value={testWasi.vocabularioT ?? undefined} />
              <Row label="Cubos (T)"                value={testWasi.cubosT ?? undefined} />
              <Row label="Semelhanças (T)"          value={testWasi.semelhancasT ?? undefined} />
              <Row label="Raciocínio Matricial (T)" value={testWasi.raciocMatricialT ?? undefined} />
            </TestBlock>
          )}

          {testMoca && (
            <TestBlock title="MoCA — Montreal Cognitive Assessment" description="Triagem cognitiva global (máx. 30 pontos). Corte: ≥ 26 = Normal.">
              <Row label="Escore Total"       value={`${testMoca.totalScore}/30`} />
              <Row label="Bônus escolaridade" value={testMoca.educationBonus ? "Sim (+1)" : "Não"} />
              <Row label="Escore Ajustado"    value={`${testMoca.adjustedScore}/30`} />
              <Row label="Classificação"      value={testMoca.classification} />
              <Row label="Visuoespacial"      value={`${testMoca.visuospatial}/5`} />
              <Row label="Nomeação"           value={`${testMoca.naming}/3`} />
              <Row label="Atenção"            value={`${testMoca.attention}/6`} />
              <Row label="Linguagem"          value={`${testMoca.language}/3`} />
              <Row label="Abstração"          value={`${testMoca.abstraction}/2`} />
              <Row label="Evocação"           value={`${testMoca.recall}/5`} />
              <Row label="Orientação"         value={`${testMoca.orientation}/6`} />
            </TestBlock>
          )}

          {testRavlt && (
            <TestBlock title="RAVLT — Aprendizagem Auditivo-Verbal de Rey" description="Memória verbal de curto e longo prazo.">
              <Row label="Ensaio A1"                  value={testRavlt.trialA1} />
              <Row label="Ensaio A2"                  value={testRavlt.trialA2} />
              <Row label="Ensaio A3"                  value={testRavlt.trialA3} />
              <Row label="Ensaio A4"                  value={testRavlt.trialA4} />
              <Row label="Ensaio A5"                  value={testRavlt.trialA5} />
              <Row label="Lista B (interferência)"    value={testRavlt.trialB1} />
              <Row label="Aprendizagem Total (A1–A5)" value={testRavlt.totalLearning != null ? `${testRavlt.totalLearning}/75 — ${testRavlt.classificationLearning ?? ""}` : undefined} />
              <Row label="Evocação Imediata (A6)"     value={testRavlt.recallShort != null ? `${testRavlt.recallShort} — ${testRavlt.classificationRecallShort ?? ""}` : undefined} />
              <Row label="Evocação Tardia (A7)"       value={testRavlt.recallLong != null ? `${testRavlt.recallLong} — ${testRavlt.classificationRecallLong ?? ""}` : undefined} />
              <Row label="Reconhecimento"             value={testRavlt.recognitionHits != null ? `${testRavlt.recognitionHits} acertos, ${testRavlt.recognitionFP ?? 0} FP` : undefined} />
              {testRavlt.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testRavlt.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testRey && (
            <TestBlock title="Figura Complexa de Rey" description="Memória visuoespacial e organização perceptual.">
              <Row label="Cópia"          value={`${testRey.copyScore}/36 — ${testRey.copyClassification}`} />
              <Row label="Evocação"       value={`${testRey.recallScore}/36 — ${testRey.recallClassification}`} />
              <Row label="Retenção"       value={testRey.savings != null ? `${testRey.savings.toFixed(1)}%` : undefined} />
              {testRey.copyTime   != null && <Row label="Tempo Cópia"    value={`${testRey.copyTime}s`} />}
              {testRey.recallTime != null && <Row label="Tempo Evocação" value={`${testRey.recallTime}s`} />}
            </TestBlock>
          )}

          {testBpa2 && (
            <TestBlock title="BPA-2 — Bateria de Provas de Atenção" description="Atenção concentrada, dividida e alternada.">
              <Row label="At. Concentrada — Acertos/Erros" value={`${testBpa2.concentradaAcertos} acertos / ${testBpa2.concentradaErros} erros`} />
              <Row label="At. Concentrada — Classificação" value={testBpa2.concentradaPB != null ? `PB ${testBpa2.concentradaPB} / P${testBpa2.concentradaPercentile} — ${testBpa2.concentradaClassification ?? ""}` : undefined} />
              <Row label="At. Dividida — Acertos/Erros"    value={`${testBpa2.divididaAcertos} acertos / ${testBpa2.divididaErros} erros`} />
              <Row label="At. Dividida — Classificação"    value={testBpa2.divididaPB != null ? `PB ${testBpa2.divididaPB} / P${testBpa2.divididaPercentile} — ${testBpa2.divididaClassification ?? ""}` : undefined} />
              <Row label="At. Alternada — Acertos/Erros"   value={`${testBpa2.alternadaAcertos} acertos / ${testBpa2.alternadaErros} erros`} />
              <Row label="At. Alternada — Classificação"   value={testBpa2.alternadaPB != null ? `PB ${testBpa2.alternadaPB} / P${testBpa2.alternadaPercentile} — ${testBpa2.alternadaClassification ?? ""}` : undefined} />
            </TestBlock>
          )}

          {testFdt && (
            <TestBlock title="FDT — Five Digit Test" description="Velocidade de processamento, inibição e flexibilidade cognitiva.">
              <Row label="Leitura"             value={`${testFdt.leituraTime}s / ${testFdt.leituraErrors} erros${testFdt.leituraClassification ? ` — ${testFdt.leituraClassification}` : ""}`} />
              <Row label="Contagem"            value={`${testFdt.contagemTime}s / ${testFdt.contagemErrors} erros${testFdt.contagemClassification ? ` — ${testFdt.contagemClassification}` : ""}`} />
              <Row label="Escolha"             value={`${testFdt.escolhaTime}s / ${testFdt.escolhaErrors} erros${testFdt.escolhaClassification ? ` — ${testFdt.escolhaClassification}` : ""}`} />
              <Row label="Alternância"         value={`${testFdt.alternanciaTime}s / ${testFdt.alternanciaErrors} erros${testFdt.alternanciaClassification ? ` — ${testFdt.alternanciaClassification}` : ""}`} />
              <Row label="Inibição (5−3)"      value={testFdt.inhibitionScore != null ? `${testFdt.inhibitionScore.toFixed(1)}s${testFdt.inhibitionClassification ? ` — ${testFdt.inhibitionClassification}` : ""}` : undefined} />
              <Row label="Flexibilidade (4−3)" value={testFdt.flexibilityScore != null ? `${testFdt.flexibilityScore.toFixed(1)}s${testFdt.flexibilityClassification ? ` — ${testFdt.flexibilityClassification}` : ""}` : undefined} />
            </TestBlock>
          )}

          {testTmt && (
            <TestBlock title="TMT A/B — Trail Making Test" description="Atenção seletiva (Parte A) e funções executivas (Parte B).">
              <Row label="Parte A — Tempo" value={`${testTmt.partATime}s / ${testTmt.partAErrors} erros — ${testTmt.partAClassification}`} />
              <Row label="Parte B — Tempo" value={`${testTmt.partBTime}s / ${testTmt.partBErrors} erros — ${testTmt.partBClassification}`} />
              <Row label="Razão B/A"       value={testTmt.ratio != null ? String(testTmt.ratio.toFixed(2)) : undefined} />
            </TestBlock>
          )}

          {testCtp && (
            <TestBlock title="CTP — Teste de Performance Contínua" description="Atenção sustentada, impulsividade e vigilância.">
              <Row label="Acertos"            value={`${testCtp.hits}/${testCtp.totalTargets} (${testCtp.hitRate.toFixed(1)}%) — ${testCtp.hitRateClass}`} />
              <Row label="Omissões"           value={`${testCtp.omissions} (${testCtp.omissionRate.toFixed(1)}%)`} />
              <Row label="Comissões"          value={`${testCtp.commissions} (${testCtp.commissionRate.toFixed(1)}%)`} />
              <Row label="TR Médio"           value={`${testCtp.meanHitRT.toFixed(1)} ms — ${testCtp.rtClass}`} />
              <Row label="Variabilidade (SE)" value={`${testCtp.hitRTse.toFixed(1)} ms — ${testCtp.variabilityClass}`} />
              {testCtp.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testCtp.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testWcst && (
            <TestBlock title="WCST — Wisconsin Card Sorting Test" description="Flexibilidade cognitiva, raciocínio abstrato e controle inibitório.">
              <Row label="Categorias Completadas"     value={`${testWcst.categoriesCompleted} — ${testWcst.categoriesClass}`} />
              <Row label="Erros Perseverativos"       value={`${testWcst.perseverativeErrors} (${testWcst.perseverativeErrorsPct.toFixed(1)}%) — ${testWcst.perseverativeClass}`} />
              <Row label="Erros Não-Perseverativos"   value={`${testWcst.nonPerseverativeErrors}`} />
              <Row label="Respostas Nível Conceitual" value={`${testWcst.conceptualLevelResponses} (${testWcst.conceptualLevelPct.toFixed(1)}%) — ${testWcst.errorsClass}`} />
              <Row label="Total de Tentativas"        value={testWcst.totalTrials} />
              {testWcst.trialsFirstCategory != null && <Row label="Tentativas 1ª Categoria" value={testWcst.trialsFirstCategory} />}
              {testWcst.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testWcst.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testTorreLondres && (
            <TestBlock title="Torre de Londres" description="Planejamento, resolução de problemas e controle executivo.">
              <Row label="Soluções Corretas"  value={`${testTorreLondres.correctSolutions}/${testTorreLondres.totalProblems} (${testTorreLondres.accuracyPct.toFixed(1)}%) — ${testTorreLondres.totalScoreClass}`} />
              <Row label="Movimentos Totais"  value={testTorreLondres.totalMoves} />
              <Row label="Violações de Regra" value={testTorreLondres.ruleViolations} />
              <Row label="Tempo Total"        value={`${testTorreLondres.totalTime.toFixed(1)}s`} />
              <Row label="Tempo de Iniciação" value={`${testTorreLondres.meanInitiationTime.toFixed(1)}s (média)`} />
              <Row label="Tempo de Execução"  value={`${testTorreLondres.meanExecutionTime.toFixed(1)}s — ${testTorreLondres.executionClass}`} />
              {testTorreLondres.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testTorreLondres.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testFluencia && (
            <TestBlock title="Fluência Verbal" description="Fluência fonêmica (FAS) e semântica (animais).">
              <Row label="FAS Total (F+A+S)" value={`${testFluencia.fasTotal} — ${testFluencia.fasClassification}`} />
              <Row label="F / A / S"         value={`${testFluencia.fasF} / ${testFluencia.fasA} / ${testFluencia.fasS}`} />
              <Row label="Animais"           value={`${testFluencia.animais} — ${testFluencia.animaisClassification}`} />
            </TestBlock>
          )}

          {testBdi2 && (
            <TestBlock title="BDI-II — Inventário de Depressão de Beck" description="Autoavaliação de sintomas depressivos (21 itens, 0–63).">
              <Row label="Escore Total"  value={`${testBdi2.totalScore}`} />
              <Row label="Classificação" value={testBdi2.classification} />
            </TestBlock>
          )}

          {testBai && (
            <TestBlock title="BAI — Inventário de Ansiedade de Beck" description="Autoavaliação de sintomas ansiosos (21 itens, 0–63).">
              <Row label="Escore Total"  value={`${testBai.totalScore}`} />
              <Row label="Classificação" value={testBai.classification} />
            </TestBlock>
          )}

          {testAsrs18 && (
            <TestBlock title="ASRS-18 — Adult ADHD Self-Report Scale" description="Rastreio de TDAH em adultos (18 itens DSM-5).">
              <Row label="Parte A (6 itens)"     value={testAsrs18.partAPositiveItems != null ? `${testAsrs18.partAPositiveItems} itens positivos (escore: ${testAsrs18.scorePartA})` : undefined} />
              <Row label="Parte B (12 itens)"    value={testAsrs18.partBPositiveItems != null ? `${testAsrs18.partBPositiveItems} itens positivos (escore: ${testAsrs18.scorePartB})` : undefined} />
              <Row label="Total"                 value={testAsrs18.totalScore ?? undefined} />
              <Row label="Significância Clínica" value={testAsrs18.clinicalSignificant != null ? (testAsrs18.clinicalSignificant ? "Positivo — sugestivo de TDAH" : "Negativo") : undefined} />
              {testAsrs18.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testAsrs18.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testDiva2 && (
            <TestBlock title="DIVA 2.0 — Entrevista Diagnóstica para TDAH (DSM-5)" description="Entrevista estruturada para diagnóstico retrospectivo e atual de TDAH.">
              <Row label="Desatenção — fase adulta" value={`${testDiva2.iaAdultCount}/9 critérios (${testDiva2.meetsIaAdult ? "atende ≥5" : "não atende"})`} />
              <Row label="HI — fase adulta"          value={`${testDiva2.hiAdultCount}/9 critérios (${testDiva2.meetsHiAdult ? "atende ≥5" : "não atende"})`} />
              <Row label="Desatenção — infância"     value={`${testDiva2.iaChildCount}/9 critérios (${testDiva2.meetsIaChild ? "atende ≥6" : "não atende"})`} />
              <Row label="HI — infância"             value={`${testDiva2.hiChildCount}/9 critérios (${testDiva2.meetsHiChild ? "atende ≥6" : "não atende"})`} />
              <Row label="Diagnóstico DIVA"          value={testDiva2.diagnosis} />
            </TestBlock>
          )}

          {testCaars && (
            <TestBlock title="CAARS — Conners Adult ADHD Rating Scales" description="Escalas de rastreio de TDAH em adultos (escores T, média=50, DP=10).">
              <Row label="Índice de TDAH (T)" value={`${testCaars.adhdIndexT} — ${testCaars.adhdIndexClass}`} />
              <Row label="Desatenção (T)"     value={`${testCaars.inattentionT} — ${testCaars.inattentionClass}`} />
              <Row label="Hiperatividade (T)" value={`${testCaars.hyperactivityT} — ${testCaars.hyperactivityClass}`} />
              <Row label="Impulsividade (T)"  value={`${testCaars.impulsivityT} — ${testCaars.impulsivityClass}`} />
              <Row label="Auto-Conceito (T)"  value={`${testCaars.selfConceptT} — ${testCaars.selfConceptClass}`} />
              <Row label="DSM-IA (T)"         value={`${testCaars.dsmInattentionT} — ${testCaars.dsmInattentionClass}`} />
              <Row label="DSM-HI (T)"         value={`${testCaars.dsmHyperactivityT} — ${testCaars.dsmHyperactivityClass}`} />
              {testCaars.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testCaars.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testMfft && (
            <TestBlock title="MFFT-BR — Matching Familiar Figures Test" description="Estilo cognitivo reflexivo/impulsivo.">
              <Row label="Erros Totais"            value={testMfft.totalErrors} />
              <Row label="Latência Média"          value={testMfft.meanLatency != null ? `${testMfft.meanLatency.toFixed(2)}s` : undefined} />
              <Row label="Índice de Impulsividade" value={testMfft.impulsivityIndex != null ? testMfft.impulsivityIndex.toFixed(2) : undefined} />
              <Row label="Classificação"           value={testMfft.classification} />
              {testMfft.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testMfft.interpretation}</td></tr>
              )}
            </TestBlock>
          )}

          {testBfp && (
            <TestBlock title="BFP — Bateria Fatorial de Personalidade" description="Avaliação dos Cinco Grandes Fatores de Personalidade.">
              <Row label="Neuroticismo" value={testBfp.percentileNeuroticismo != null ? `P${testBfp.percentileNeuroticismo} — ${testBfp.classificationNeuroticismo ?? ""}` : undefined} />
              <Row label="Extroversão"  value={testBfp.percentileExtroversao  != null ? `P${testBfp.percentileExtroversao} — ${testBfp.classificationExtroversao ?? ""}` : undefined} />
              <Row label="Socialização" value={testBfp.percentileSocializacao != null ? `P${testBfp.percentileSocializacao} — ${testBfp.classificationSocializacao ?? ""}` : undefined} />
              <Row label="Realização"   value={testBfp.percentileRealizacao   != null ? `P${testBfp.percentileRealizacao} — ${testBfp.classificationRealizacao ?? ""}` : undefined} />
              <Row label="Abertura"     value={testBfp.percentileAbertura     != null ? `P${testBfp.percentileAbertura} — ${testBfp.classificationAbertura ?? ""}` : undefined} />
            </TestBlock>
          )}

          {testFauxPas && (
            <TestBlock title="Teste de Faux Pas — Teoria da Mente" description="Cognição social e Teoria da Mente (ToM). 10 histórias com faux pas + 10 controle.">
              <Row label="Total Geral" value={`${testFauxPas.totalScore}/40 — ${testFauxPas.classification}`} />
              <Row label="Índice ToM"  value={testFauxPas.fauxPasIndex != null ? `${testFauxPas.fauxPasIndex.toFixed(1)}%` : undefined} />
              <Row label="Detecção"    value={`${testFauxPas.detectionScore}/10`} />
              <Row label="Compreensão" value={`${testFauxPas.understandingScore}/10`} />
              <Row label="Empatia"     value={`${testFauxPas.empathyScore}/10`} />
              <Row label="Controle"    value={`${testFauxPas.controlScore}/10`} />
              {testFauxPas.interpretation && (
                <tr><td colSpan={2} className="pt-2 text-xs leading-relaxed text-gray-700 italic">{testFauxPas.interpretation}</td></tr>
              )}
            </TestBlock>
          )}
        </Section>

        <div className="mt-10 pt-6 border-t border-gray-300 flex flex-col items-center gap-1">
          <div className="w-64 border-t border-gray-800 pt-2 text-center">
            <p className="text-xs font-semibold">{psychologistName || "Psicólogo(a)"}</p>
            <p className="text-[10px] text-gray-500">Psicólogo(a) Neuropsicólogo(a)</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Laudo gerado em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="print:hidden flex justify-end pb-8">
        <PrintButton />
      </div>
    </div>
  );
}
