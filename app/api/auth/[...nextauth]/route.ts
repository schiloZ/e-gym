import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions = {
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

        // Try to find the user in both User and SuperAdmin models
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
            companyId: true, // Fetch companyId
            company: {
              select: {
                id: true,
                name: true, // Fetch companyName
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
            companyId: user.companyId, // Include companyId
            companyName: user.company?.name || null, // Include companyName
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
            companyId: null, // Superadmins may not have a company
            companyName: null, // Superadmins may not have a company
          };
        } else {
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role || "user";
        token.isSuperAdmin = user.isSuperAdmin || false;
        token.needsRegistration = user.needsRegistration || false;
        token.paymentCount = user.paymentCount;
        token.maxPayments = user.maxPayments;
        token.companyId = user.companyId || null; // Add companyId to token
        token.companyName = user.companyName || null; // Add companyName to token
        token.subscriptionType = user.subscriptionType || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.isSuperAdmin = token.isSuperAdmin;
        session.user.needsRegistration = token.needsRegistration;
        session.user.companyId = token.companyId; // Add companyId to session
        session.user.companyName = token.companyName; // Add companyName to session
        session.user.subscriptionType = token.subscriptionType;
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
