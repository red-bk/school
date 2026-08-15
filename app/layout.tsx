import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رفع الأوراق",
  description: "يقوم المعلمون برفع الأوراق إلى التخزين السحابي",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
