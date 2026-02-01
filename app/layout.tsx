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
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EasyTalk",
  description: "Real-time multilingual chat - everyone speaks their native language",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "EasyTalk",
    description: "Speak Your Language. Connect with Everyone. Real-time chat that automatically translates every message.",
    url: "https://easytalk.app",
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
        </body>
      </html>
    </ClerkProvider>
  );
}
