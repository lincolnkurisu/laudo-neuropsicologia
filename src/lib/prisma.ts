import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 usa o engine "client" (WebAssembly) que requer um driver adapter.
// Em desenvolvimento o singleton é reutilizado entre hot-reloads.

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Em build sem DATABASE_URL (ex: deploy preview sem DB), retorna um client
    // não conectado para não quebrar a análise estática do Next.js.
    // As rotas de API já têm `export const dynamic = 'force-dynamic'`,
    // então o código de runtime nunca chegará aqui sem DATABASE_URL.
    return new PrismaClient({ adapter: null as never });
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
