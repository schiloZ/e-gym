// lib/authOptions.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                subscriptionType: true,
              },
            },
          },
        });

        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
          },
        });

        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return {
            ...user,
            isSuperAdmin: false,
            needsRegistration: false,
            companyId: user.companyId,
            companyName: user.company?.name || null,
          };
        } else if (
          superAdmin &&
          bcrypt.compareSync(credentials.password, superAdmin.password)
        ) {
          return {
            id: superAdmin.id,
            email: superAdmin.email,
            role: "superadmin",
            isSuperAdmin: true,
            needsRegistration: true,
            subscriptionEndDate: null,
            subscriptionType: null,
            clientRegistrationCount: null,
            maxClientRegistrations: null,
            paymentCount: null,
            maxPayments: null,
            companyId: null,
            companyName: null,
          };
        } else {
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role || "user";
        token.isSuperAdmin = user.isSuperAdmin || false;
        token.needsRegistration = user.needsRegistration || false;
        token.paymentCount = user.paymentCount;
        token.maxPayments = user.maxPayments;
        token.companyId = user.companyId || null;
        token.companyName = user.companyName || null;
        token.subscriptionType = user.subscriptionType || null;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token?.userId) {
        session.user = {
          ...session.user,
          id: token.userId,
          role: token.role,
          isSuperAdmin: token.isSuperAdmin,
          needsRegistration: token.needsRegistration,
          companyId: token.companyId,
          companyName: token.companyName,
          subscriptionType: token.subscriptionType,
        };
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
