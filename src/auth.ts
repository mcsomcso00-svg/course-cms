import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.isActive || !user.passwordHash) return null;

        const passwordOk = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!passwordOk) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "phone-otp",
      credentials: { phone: {}, code: {} },
      authorize: async (credentials) => {
        const phone = String(credentials?.phone ?? "").trim();
        const code = String(credentials?.code ?? "").trim();
        if (!phone || !code) return null;

        const rec = await prisma.verificationCode.findFirst({
          where: { phone, code },
          orderBy: { createdAt: "desc" },
        });
        if (!rec || rec.expiresAt < new Date()) return null;

        const user = await prisma.user.findFirst({
          where: { phone, role: "TUTOR", isActive: true },
        });
        if (!user) return null;

        // 用後即棄：清除此電話所有驗證碼
        await prisma.verificationCode.deleteMany({ where: { phone } });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "ADMIN" | "TUTOR";
      return session;
    },
  },
});
