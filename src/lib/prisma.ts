import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 usa engine "client" (WebAssembly) que EXIGE um driver adapter real.
// Para evitar falha no `next build` (sem DATABASE_URL), usamos um Proxy:
// o PrismaClient só é instanciado quando um método é chamado pela 1ª vez
// (em runtime), nunca durante a análise estática do build.

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Configure a variável de ambiente no Vercel."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getClient(): PrismaClient {
  if (globalThis.__prisma) return globalThis.__prisma;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = client;
  }
  return client;
}

// O Proxy adia a criação do PrismaClient para o primeiro acesso em runtime.
// Durante o `next build`, este módulo é importado mas nenhum método é chamado,
// então createPrismaClient() nunca roda sem DATABASE_URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
