import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "../components/AppLayout/AppLayout.jsx";
// import SessionProvider from "../components/SessionProvider/SessionProvider.jsx";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "iChat - Advanced Chat Application",
  description:
    "The most advanced chat application for teams and individuals. Connect, collaborate, and communicate seamlessly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* <SessionProvider> */}
        <AppLayout>{children}</AppLayout>
        {/* </SessionProvider> */}
      </body>
    </html>
  );
}
