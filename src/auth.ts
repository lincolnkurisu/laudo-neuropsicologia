import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// In-memory rate limiter (per serverless instance — best-effort)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(email);

  if (entry) {
    if (now < entry.lockedUntil) return false; // still locked
    if (now - entry.lockedUntil > 15 * 60 * 1000) {
      loginAttempts.delete(email); // reset after 15min past lock
    }
  }
  return true;
}

function recordFailure(email: string) {
  const now = Date.now();
  const entry = loginAttempts.get(email) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  // Lock for 15 minutes after 5 failed attempts
  if (entry.count >= 5) entry.lockedUntil = now + 15 * 60 * 1000;
  loginAttempts.set(email, entry);
}

function recordSuccess(email: string) {
  loginAttempts.delete(email);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        // Rate-limit check
        if (!checkRateLimit(email)) {
          throw new Error("Muitas tentativas. Aguarde 15 minutos.");
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.passwordHash) {
          // Constant-time: still compare to prevent timing attacks
          await compare(parsed.data.password, "$2b$12$invalidhashplaceholderXXXXXXX");
          recordFailure(email);
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          recordFailure(email);
          return null;
        }

        recordSuccess(email);
        return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
      },
    }),
  ],
});
