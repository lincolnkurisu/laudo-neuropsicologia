/**
 * Scoring Services – ponto de entrada centralizado
 *
 * Testes implementados:
 *  ✅ ASRS-18   – Rastreio de TDAH em adultos
 *  ✅ BPA-2     – Bateria de Provas de Atenção
 *  🔜 WASI      – Escala Wechsler Abreviada de Inteligência (próxima iteração)
 *  🔜 FDT       – Five Digit Test (próxima iteração)
 *  🔜 BFP       – Bateria Fatorial de Personalidade (próxima iteração)
 */

export { scoreAsrs18, dbRowToAsrs18Input } from "./asrs18";
export { scoreBpa2 } from "./bpa2";
