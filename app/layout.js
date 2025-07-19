// app/layout.js

import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
// import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Mock Interview",
  description: "AI-powered mock interview platform to boost your confidence",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Toaster/>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
