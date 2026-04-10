/**
 * Motor de recomendação clínica de testes neuropsicológicos
 * Analisa dados da anamnese + demographics para sugerir bateria adequada
 */

export type TestPriority = "essencial" | "recomendado" | "opcional";

export interface TestRecommendation {
  testKey: string;
  label: string;
  slug: string;
  priority: TestPriority;
  reasons: string[];
}

interface AnamnesisData {
  mainComplaint?: string | null;
  complaintDuration?: string | null;
  medicalHistory?: string | null;
  learningDifficulties?: string | null;
  familyHistory?: string | null;
  currentMedications?: string | null;
  schoolHistory?: string | null;
  clinicalObservations?: string | null;
  behaviorDuringSession?: string | null;
  recentLifeEvents?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos para matching mais robusto
}

function match(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some((kw) => n.includes(normalize(kw)));
}

function matchAll(fields: (string | null | undefined)[], keywords: string[]): boolean {
  return fields.some((f) => f && match(f, keywords));
}

// ─── Mapeamento clínico ───────────────────────────────────────────────────────

const KEYWORDS = {
  memoria: [
    "memória", "memoria", "esquecer", "esquecimento", "lembrar", "recordar",
    "amnésia", "amnesia", "confusão", "confusao", "desorientado", "desorientação",
    "desorientacao", "lembra", "esquece", "lapsos", "memório",
  ],
  demencia: [
    "demência", "demencia", "alzheimer", "alzeimer", "idoso", "senil",
    "deterioração", "deterioracao", "declínio", "declinio", "cognitivo",
  ],
  atencao: [
    "atenção", "atencao", "concentração", "concentracao", "distraído", "distraido",
    "distração", "distracao", "foco", "desatento", "desatenção", "desatencao",
    "hiperativo", "hiperatividade", "impulsivo", "impulsividade", "agitado",
    "agitação", "agitacao", "irrequieto", "inquieto", "fidget",
  ],
  tdah: [
    "tdah", "adhd", "add", "déficit de atenção", "deficit de atencao",
    "hiperatividade", "impulsividade", "desatenção", "desatencao",
  ],
  depressao: [
    "depressão", "depressao", "deprimido", "tristeza", "triste", "humor",
    "desmotivado", "desmotivação", "anedonia", "prazer", "choro", "chorar",
    "desânimo", "desanimo", "sem energia", "baixa autoestima", "autoestima",
    "melancolia", "humor rebaixado", "vazio", "esperança",
  ],
  ansiedade: [
    "ansiedade", "ansioso", "ansiosa", "medo", "pânico", "panico",
    "preocupação", "preocupacao", "nervoso", "tensão", "tensao", "estresse",
    "stress", "fobia", "angústia", "angustia", "worry", "nervosismo",
  ],
  aprendizagem: [
    "aprendizagem", "aprendizado", "escolar", "escola", "rendimento escolar",
    "dificuldade escolar", "dificuldade de aprender", "dislexia", "disgrafia",
    "discalculia", "leitura", "escrita", "matemática", "matematica",
    "repetência", "reprovação", "reprovacao", "educação especial",
  ],
  inteligencia: [
    "inteligência", "inteligencia", "qi", "q.i.", "cognitivo", "capacidade",
    "aptidão", "aptidao", "desenvolvimento", "déficit cognitivo",
  ],
  executivo: [
    "organização", "organizacao", "planejamento", "planejar", "flexibilidade",
    "inibição", "iniciar tarefa", "procrastinação", "procrastinacao",
    "desorganizado", "dificuldade para planejar", "sequência", "sequencia",
    "funções executivas", "funcoes executivas", "perseveração", "perseveracao",
  ],
  linguagem: [
    "linguagem", "fala", "palavra", "nomeação", "nomeacao", "afasia",
    "disfasia", "vocabulário", "vocabulario", "comunicação", "comunicacao",
    "discurso", "nomear",
  ],
  personalidade: [
    "personalidade", "comportamento", "relacionamento", "social",
    "caráter", "carater", "temperamento", "transtorno de personalidade",
    "borderline", "humor instável", "instabilidade emocional",
  ],
  visuoespacial: [
    "visual", "visuoespacial", "espacial", "desenho", "figura",
    "construção", "construcao", "cópia", "copia", "percepção visual",
  ],
  impulsividade: [
    "impulsiv", "impulsivo", "impulsividade", "agir sem pensar", "precipitado",
    "sem controle", "reatividade", "explosiv", "temperamento explosivo",
    "tomar decisões rápidas", "decisao rapida",
  ],
  atencaoSustentada: [
    "atenção sustentada", "atencao sustentada", "manter atenção", "manter atencao",
    "vigil", "vigilância", "vigilancia", "cansaço mental", "cansaco mental",
    "fadiga cognitiva", "concentra por pouco tempo",
  ],
  cognicaoSocial: [
    "teoria da mente", "cognição social", "cognicao social", "empatia", "empático",
    "dificuldade social", "relacionamento social", "autismo", "tea", "asperger",
    "faux pas", "gafe", "social", "reconhecer emoções", "reconhecer emocoes",
    "leitura facial", "expressão facial", "intencao", "intenção",
    "dificuldade de perceber", "não percebe", "nao percebe",
  ],
};

// ─── Engine de recomendação ───────────────────────────────────────────────────

export function getTestRecommendations(
  anamnesis: AnamnesisData,
  age: number,
  educationLevel: string,
): TestRecommendation[] {
  const allFields = [
    anamnesis.mainComplaint,
    anamnesis.medicalHistory,
    anamnesis.learningDifficulties,
    anamnesis.familyHistory,
    anamnesis.schoolHistory,
    anamnesis.clinicalObservations,
    anamnesis.behaviorDuringSession,
  ];

  const hasMemoria           = matchAll(allFields, KEYWORDS.memoria);
  const hasDemencia          = matchAll(allFields, KEYWORDS.demencia);
  const hasAtencao           = matchAll(allFields, KEYWORDS.atencao);
  const hasTdah              = matchAll(allFields, KEYWORDS.tdah);
  const hasDepressao         = matchAll(allFields, KEYWORDS.depressao);
  const hasAnsiedade         = matchAll(allFields, KEYWORDS.ansiedade);
  const hasAprendizagem      = matchAll(allFields, KEYWORDS.aprendizagem);
  const hasInteligencia      = matchAll(allFields, KEYWORDS.inteligencia);
  const hasExecutivo         = matchAll(allFields, KEYWORDS.executivo);
  const hasLinguagem         = matchAll(allFields, KEYWORDS.linguagem);
  const hasPersonalidade     = matchAll(allFields, KEYWORDS.personalidade);
  const hasVisuoespacial     = matchAll(allFields, KEYWORDS.visuoespacial);
  const hasImpulsividade     = matchAll(allFields, KEYWORDS.impulsividade);
  const hasAtencaoSustentada = matchAll(allFields, KEYWORDS.atencaoSustentada);
  const hasCognicaoSocial    = matchAll(allFields, KEYWORDS.cognicaoSocial);

  const isIdoso   = age >= 60;
  const isAdolesc = age < 18;
  const lowEduc   = ["NO_FORMAL_EDUCATION", "INCOMPLETE_ELEMENTARY", "COMPLETE_ELEMENTARY"].includes(educationLevel);

  const recs: Map<string, TestRecommendation> = new Map();

  function add(
    testKey: string, label: string, slug: string,
    priority: TestPriority, reason: string,
  ) {
    if (recs.has(testKey)) {
      const existing = recs.get(testKey)!;
      existing.reasons.push(reason);
      // upgrade priority: essencial > recomendado > opcional
      if (priority === "essencial") existing.priority = "essencial";
      else if (priority === "recomendado" && existing.priority === "opcional") existing.priority = "recomendado";
    } else {
      recs.set(testKey, { testKey, label, slug, priority, reasons: [reason] });
    }
  }

  // ── MoCA ─────────────────────────────────────────────────────────────────
  if (isIdoso) {
    add("testMoca", "MoCA", "moca", "essencial", "Triagem cognitiva indicada para pacientes acima de 60 anos");
  }
  if (hasDemencia) {
    add("testMoca", "MoCA", "moca", "essencial", "Queixa compatível com declínio cognitivo / demência");
  }
  if (hasMemoria && isIdoso) {
    add("testMoca", "MoCA", "moca", "essencial", "Queixa de memória em idoso requer triagem cognitiva");
  }

  // ── WASI ─────────────────────────────────────────────────────────────────
  if (hasInteligencia || hasAprendizagem) {
    add("testWasi", "WASI", "wasi", "essencial", "Avaliação do QI indicada para queixa de aprendizagem ou cognitiva");
  }
  if (hasTdah && !isAdolesc) {
    add("testWasi", "WASI", "wasi", "recomendado", "Avaliação de QI complementar ao rastreio de TDAH");
  }

  // ── RAVLT ─────────────────────────────────────────────────────────────────
  if (hasMemoria) {
    add("testRavlt", "RAVLT", "ravlt", "essencial", "Queixa de memória verbal — avaliação direta com lista de palavras");
  }
  if (hasDemencia) {
    add("testRavlt", "RAVLT", "ravlt", "essencial", "Investigação de demência requer avaliação detalhada da memória verbal");
  }
  if (isIdoso) {
    add("testRavlt", "RAVLT", "ravlt", "recomendado", "Avaliação de memória recomendada em idosos");
  }

  // ── Figura de Rey ──────────────────────────────────────────────────────
  if (hasMemoria || hasVisuoespacial) {
    add("testRey", "Figura de Rey", "rey", "essencial", "Avalia memória visuoespacial, complementar ao RAVLT");
  }
  if (hasDemencia) {
    add("testRey", "Figura de Rey", "rey", "recomendado", "Avaliação visuoespacial importante no diagnóstico diferencial de demências");
  }
  if (hasAprendizagem) {
    add("testRey", "Figura de Rey", "rey", "recomendado", "Avalia organização visuoespacial e memória não verbal");
  }

  // ── BPA-2 ──────────────────────────────────────────────────────────────
  if (hasAtencao || hasTdah) {
    add("testBpa2", "BPA-2", "bpa2", "essencial", "Queixa de atenção / TDAH — avaliação específica dos subtipos atencionais");
  }

  // ── TMT A/B ────────────────────────────────────────────────────────────
  if (hasAtencao || hasTdah || hasExecutivo) {
    add("testTmt", "TMT A/B", "tmt", "essencial", "Avalia atenção seletiva (A) e flexibilidade cognitiva / alternância (B)");
  }
  if (isIdoso || hasDemencia) {
    add("testTmt", "TMT A/B", "tmt", "recomendado", "Sensível a declínio de funções executivas e velocidade de processamento");
  }

  // ── FDT ────────────────────────────────────────────────────────────────
  if (hasAtencao || hasTdah || hasExecutivo) {
    add("testFdt", "FDT", "fdt", "recomendado", "Complementa avaliação de inibição e flexibilidade cognitiva");
  }

  // ── Fluência Verbal ────────────────────────────────────────────────────
  if (hasLinguagem || hasExecutivo) {
    add("testFluencia", "Fluência Verbal", "fluencia", "essencial", "Queixa de linguagem ou executivo — avaliar fluência fonêmica e semântica");
  }
  if (hasDemencia) {
    add("testFluencia", "Fluência Verbal", "fluencia", "essencial", "Declínio de fluência verbal é sensível ao diagnóstico de demência");
  }
  if (hasMemoria || isIdoso) {
    add("testFluencia", "Fluência Verbal", "fluencia", "recomendado", "Fluência semântica (animais) é indicador sensível de comprometimento cognitivo");
  }

  // ── BDI-II ─────────────────────────────────────────────────────────────
  if (hasDepressao) {
    add("testBdi2", "BDI-II", "bdi2", "essencial", "Queixa de depressão / humor rebaixado — quantificar gravidade dos sintomas");
  }
  if (hasAnsiedade) {
    add("testBdi2", "BDI-II", "bdi2", "recomendado", "Ansiedade frequentemente comórbida com depressão");
  }
  if (isIdoso) {
    add("testBdi2", "BDI-II", "bdi2", "recomendado", "Depressão em idosos pode mimetizar quadros demenciais (pseudodemência)");
  }

  // ── BAI ─────────────────────────────────────────────────────────────────
  if (hasAnsiedade) {
    add("testBai", "BAI", "bai", "essencial", "Queixa de ansiedade — quantificar gravidade dos sintomas");
  }
  if (hasDepressao) {
    add("testBai", "BAI", "bai", "recomendado", "Depressão frequentemente comórbida com ansiedade");
  }

  // ── ASRS-18 ────────────────────────────────────────────────────────────
  if (hasTdah) {
    add("testAsrs18", "ASRS-18", "asrs18", "essencial", "Suspeita de TDAH — escala de autorrelato de 18 itens (critérios DSM)");
  }
  if (hasAtencao && !isIdoso) {
    add("testAsrs18", "ASRS-18", "asrs18", "recomendado", "Queixa atencional em adulto — rastreio de TDAH indicado");
  }

  // ── BFP ────────────────────────────────────────────────────────────────
  if (hasPersonalidade) {
    add("testBfp", "BFP", "bfp", "essencial", "Queixa comportamental / relacional — avaliação dos cinco grandes fatores");
  }
  if (hasDepressao || hasAnsiedade) {
    add("testBfp", "BFP", "bfp", "opcional", "Perfil de personalidade pode contextualizar vulnerabilidades emocionais");
  }

  // ── DIVA 2.0 ───────────────────────────────────────────────────────────
  if (hasTdah) {
    add("testDiva2", "DIVA 2.0", "diva2", "essencial", "Suspeita de TDAH — entrevista diagnóstica estruturada com critérios DSM-5 para infância e vida adulta");
  }
  if (hasAtencao && !isIdoso) {
    add("testDiva2", "DIVA 2.0", "diva2", "recomendado", "Queixa atencional em adulto — investigar TDAH com entrevista estruturada");
  }
  if (hasImpulsividade && !isIdoso) {
    add("testDiva2", "DIVA 2.0", "diva2", "recomendado", "Queixa de impulsividade — rastreio de TDAH com entrevista DIVA");
  }

  // ── CAARS ──────────────────────────────────────────────────────────────
  if (hasTdah) {
    add("testCaars", "CAARS", "caars", "essencial", "Suspeita de TDAH — escala de autorrelato multidimensional com normas para adultos");
  }
  if (hasAtencao && !isIdoso) {
    add("testCaars", "CAARS", "caars", "recomendado", "Queixa atencional — CAARS quantifica subtipos e gravidade dos sintomas");
  }

  // ── CTP ────────────────────────────────────────────────────────────────
  if (hasAtencaoSustentada || hasTdah) {
    add("testCtp", "CTP", "ctp", "essencial", "Avaliação objetiva da atenção sustentada e controle inibitório por medida de desempenho");
  }
  if (hasAtencao && !isIdoso) {
    add("testCtp", "CTP", "ctp", "recomendado", "Complementa avaliação atencional com medida de vigilância contínua");
  }

  // ── WCST ───────────────────────────────────────────────────────────────
  if (hasExecutivo) {
    add("testWcst", "WCST", "wcst", "essencial", "Queixa executiva — avalia flexibilidade cognitiva e perseveração");
  }
  if (hasTdah || hasAtencao) {
    add("testWcst", "WCST", "wcst", "recomendado", "Complementa investigação de TDAH/atenção com medida de flexibilidade cognitiva");
  }
  if (hasDemencia || isIdoso) {
    add("testWcst", "WCST", "wcst", "recomendado", "Sensível a déficits de funções executivas em quadros demenciais");
  }

  // ── Torre de Londres ───────────────────────────────────────────────────
  if (hasExecutivo) {
    add("testTorreLondres", "Torre de Londres", "torre-londres", "essencial", "Avalia planejamento, resolução de problemas e eficiência executiva");
  }
  if (hasTdah) {
    add("testTorreLondres", "Torre de Londres", "torre-londres", "recomendado", "Planejamento e controle inibitório frequentemente comprometidos no TDAH");
  }
  if (hasAprendizagem) {
    add("testTorreLondres", "Torre de Londres", "torre-londres", "recomendado", "Dificuldades escolares podem refletir déficits de planejamento executivo");
  }

  // ── MFFT-BR ────────────────────────────────────────────────────────────
  if (hasImpulsividade || hasTdah) {
    add("testMfft", "MFFT-BR", "mfft", "essencial", "Avalia estilo cognitivo impulsivo vs. reflexivo e tempo de resposta");
  }
  if (hasAprendizagem) {
    add("testMfft", "MFFT-BR", "mfft", "recomendado", "Impulsividade cognitiva pode impactar aprendizagem e rendimento escolar");
  }
  if (hasAtencao && !isIdoso) {
    add("testMfft", "MFFT-BR", "mfft", "recomendado", "Complementa avaliação de controle inibitório em queixas atencionais");
  }

  // ── Faux Pas ───────────────────────────────────────────────────────────
  if (hasCognicaoSocial) {
    add("testFauxPas", "Faux Pas", "fauxpas", "essencial", "Queixa de cognição social / empatia — avalia Teoria da Mente e reconhecimento de situações sociais inadequadas");
  }
  if (hasTdah || hasPersonalidade) {
    add("testFauxPas", "Faux Pas", "fauxpas", "recomendado", "Cognição social pode estar comprometida em TDAH e transtornos de personalidade");
  }
  if (hasExecutivo) {
    add("testFauxPas", "Faux Pas", "fauxpas", "opcional", "Funções executivas e cognição social frequentemente co-ocorrem em quadros frontais");
  }

  // ── Regras gerais ──────────────────────────────────────────────────────
  // Se nenhuma queixa específica foi detectada, bateria mínima
  if (recs.size === 0) {
    add("testMoca",  "MoCA",    "moca",  "recomendado", "Triagem cognitiva geral recomendada na ausência de queixa específica");
    add("testBdi2",  "BDI-II",  "bdi2",  "recomendado", "Rastreio de humor recomendado rotineiramente");
    add("testBai",   "BAI",     "bai",   "recomendado", "Rastreio de ansiedade recomendado rotineiramente");
    add("testRavlt", "RAVLT",   "ravlt", "opcional",    "Avaliação de memória verbal para baseline");
  }

  // ── Ordenar: essencial → recomendado → opcional ────────────────────────
  const order: Record<TestPriority, number> = { essencial: 0, recomendado: 1, opcional: 2 };
  return Array.from(recs.values()).sort((a, b) => order[a.priority] - order[b.priority]);
}
