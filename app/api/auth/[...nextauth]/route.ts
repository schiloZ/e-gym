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
            subscriptionEndDate: true,
            subscriptionType: true, // Add subscriptionType
            clientRegistrationCount: true, // Add clientRegistrationCount
            maxClientRegistrations: true, // Add maxClientRegistrations
            paymentCount: true, // Add paymentCount
            maxPayments: true, // Add maxPayments
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
            subscriptionEndDate: user.subscriptionEndDate,
            subscriptionType: user.subscriptionType, // Include subscriptionType
            clientRegistrationCount: user.clientRegistrationCount, // Include clientRegistrationCount
            maxClientRegistrations: user.maxClientRegistrations, // Include maxClientRegistrations
            paymentCount: user.paymentCount, // Include paymentCount
            maxPayments: user.maxPayments, // Include maxPayments
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
            subscriptionEndDate: null, // Superadmins may not have subscriptions
            subscriptionType: null, // Superadmins typically don't have a subscription
            clientRegistrationCount: null, // Superadmins don't have limits
            maxClientRegistrations: null, // Unlimited for superadmins
            paymentCount: null, // Superadmins don't have limits
            maxPayments: null, // Unlimited for superadmins
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
        token.subscriptionEndDate = user.subscriptionEndDate;
        token.subscriptionType = user.subscriptionType; // Add to token
        token.clientRegistrationCount = user.clientRegistrationCount; // Add to token
        token.maxClientRegistrations = user.maxClientRegistrations; // Add to token
        token.paymentCount = user.paymentCount; // Add to token
        token.maxPayments = user.maxPayments; // Add to token
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.isSuperAdmin = token.isSuperAdmin;
        session.user.needsRegistration = token.needsRegistration;
        session.user.subscriptionEndDate = token.subscriptionEndDate;
        session.user.subscriptionType = token.subscriptionType; // Add to session
        session.user.clientRegistrationCount = token.clientRegistrationCount; // Add to session
        session.user.maxClientRegistrations = token.maxClientRegistrations; // Add to session
        session.user.paymentCount = token.paymentCount; // Add to session
        session.user.maxPayments = token.maxPayments; // Add to session
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
