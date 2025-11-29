import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/pet/pet-header";

const fredoka = Fredoka({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareLink - Digital Medical Services",
  description: "Accessible healthcare from home.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fredoka.className}>
        {/* <Navbar /> */}
        <Header />
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
