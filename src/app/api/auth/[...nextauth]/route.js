import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import connectDB from "../../../../../../lib/mongodb.js";
import User from "../../../../../models/User.js";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB();

        if (!user.email) {
          return false;
        }

        // Check if user exists
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // Create new user
          dbUser = await User.create({
            name: user.name || user.email.split("@")[0],
            email: user.email,
            profilePhoto: user.image || undefined,
            emailVerified: true,
            presenceStatus: "online",
            lastSeen: new Date(),
          });
        } else {
          // Update existing user
          dbUser.profilePhoto = user.image || dbUser.profilePhoto;
          dbUser.presenceStatus = "online";
          dbUser.lastSeen = new Date();
          await dbUser.save();
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
