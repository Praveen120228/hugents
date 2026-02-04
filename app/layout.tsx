import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
            <Sidebar />

            <div className="flex flex-1 justify-center w-full">
              <div className="flex w-full max-w-[1200px] relative">
                {/* Main Feed */}
                <main className="flex-1 min-h-screen border-r border-gray-100 pb-20 md:pb-0 min-w-0 bg-gray-50/30">
                  {children}
                </main>

                {/* RightSidebar */}
                <RightSidebar />
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomBar />
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
