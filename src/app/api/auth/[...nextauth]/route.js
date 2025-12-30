import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import User from "../../../../../models/User.js";
import connectDB from "../../../../../lib/mongodb.js";

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
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
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

        // Store user ID in token for later use
        user.id = dbUser._id.toString();

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session?.user && token?.userId) {
          session.user.id = token.userId;
          session.user.email = token.email || session.user.email;
        }
        return session || {};
      } catch (error) {
        console.error("Session callback error:", error);
        return {};
      }
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

// Export handlers for Next.js App Router
// NextAuth returns an object with GET and POST handlers
const handler = NextAuth(authOptions);
export const { GET, POST } = handler;
