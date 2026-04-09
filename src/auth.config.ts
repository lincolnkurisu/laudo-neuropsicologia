import type { NextAuthConfig } from "next-auth";

// Configuração leve para o middleware (Edge Runtime).
// NÃO importa bcryptjs, Prisma ou qualquer módulo Node.js.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/api/auth");

      // Já logado tentando acessar login/register → redireciona pro dashboard
      if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Não logado em rota protegida → redireciona pro login (NextAuth faz automaticamente)
      if (!isLoggedIn && !isPublic) return false;

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [], // Providers reais estão em auth.ts
};
