import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: {
    default: "AppForge AI — Build Apps with AI",
    template: "%s | AppForge AI",
  },
  description:
    "Transform natural language requirements into complete application schemas using a 6-stage AI compiler pipeline. Powered by Gemini.",
  keywords: ["AI", "app builder", "code generator", "Gemini", "Next.js"],
  openGraph: {
    title: "AppForge AI",
    description: "Build complete apps from natural language with AI",
    type: "website",
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
