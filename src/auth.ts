import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

// Database session strategy via the Drizzle adapter, so sessions/users join to
// the app tables. Google credentials are read from AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [Google],
  trustHost: true,
  callbacks: {
    // Expose the user id on the session for the data-access layer.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
