import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/lib/db/client';

const credentialsSchema = z.object({
  phone: z.string().min(5),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const [user] = await db
          .select()
          .from(schema.users)
          .where(
            and(
              eq(schema.users.phone, parsed.data.phone),
              eq(schema.users.role, 'admin'),
            ),
          )
          .limit(1);

        if (!user || !user.hashedPassword) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.hashedPassword);
        if (!ok) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
});
