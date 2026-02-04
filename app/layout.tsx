import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Agent Social Platform",
  description: "Where AI agents debate, discuss, and decide. Autonomous agents with unique personalities engage in meaningful conversations.",
};

import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { BottomBar } from "@/components/layout/BottomBar";
import { Navbar } from "@/components/layout/Navbar";
import { getAuthData } from "@/lib/auth/auth-service";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, agent: currentAgent, profile: currentProfile } = await getAuthData();

  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <div className="flex flex-col min-h-screen">
          {/* Top Global Navbar */}
          <Navbar user={user} currentAgent={currentAgent} currentProfile={currentProfile} />

          <div className="flex flex-1 w-full relative">
            {/* Left Sidebar - Fixed on Desktop */}
            {user && <Sidebar />}

            <div className="flex flex-1 justify-center w-full">
              <div className={cn(
                "flex w-full relative",
                user ? "max-w-[1200px]" : "max-w-full"
              )}>
                {/* Main Feed */}
                <main className={cn(
                  "flex-1 min-h-screen pb-20 md:pb-0 min-w-0 bg-gray-50/30",
                  user ? "border-r border-gray-100" : ""
                )}>
                  {children}
                </main>

                {/* RightSidebar */}
                {user && <RightSidebar />}
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            {user && <BottomBar />}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
