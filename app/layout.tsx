import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "EasyTalk",
  description: "Real-time multilingual chat - everyone speaks their native language",
  openGraph: {
    title: "EasyTalk",
    description: "Speak Your Language. Connect with Everyone. Real-time chat that automatically translates every message.",
    siteName: "EasyTalk",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "EasyTalk - Real-time multilingual chat",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyTalk",
    description: "Speak Your Language. Connect with Everyone. Real-time chat that automatically translates every message.",
    images: ["/og-twitter.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0a0a0a",
          colorBackground: "#ffffff",
          colorText: "#0a0a0a",
          colorTextSecondary: "#71717a",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-background border border-border shadow-sm",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border border-border bg-background hover:bg-accent",
          formFieldInput:
            "bg-background border-border focus:border-foreground",
          footerActionLink: "text-foreground hover:text-foreground/80",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <QueryProvider>
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 sm:px-12 lg:px-20">
              <div className="text-sm font-medium tracking-tight text-foreground/60">
                <SignedIn>
                  <span>EasyTalk</span>
                </SignedIn>
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "size-8",
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </header>
            {children}
            <Toaster position="top-center" />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
