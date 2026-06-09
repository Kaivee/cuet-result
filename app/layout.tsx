import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CUET Marks — Answer Sheet Comparator",
  description:
    "Upload your NTA CUET Response Sheet and Answer Key PDFs to instantly compare your answers and calculate your score. See correct, incorrect, and skipped questions at a glance.",
  keywords: ["CUET", "NTA", "answer key", "response sheet", "marks calculator"],
  openGraph: {
    title: "CUET Marks — Answer Sheet Comparator",
    description:
      "Instantly compare your CUET response sheet with the official answer key and calculate your score.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
