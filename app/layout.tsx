import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import { ToastProvider } from "@/contexts/ToastContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const metadata: Metadata = {
  title: "Verse",
  description: "Verse - Social platform for church youth communities. Connect, vote, chat, and grow together in faith. Youth Connect by AFM Rzeszow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <ToastProvider>
          <NotificationProvider>
            <Navigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex-grow w-full pb-20 md:pb-8">
              {children}
            </main>
            <Footer />
            <BottomNavigation />
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

