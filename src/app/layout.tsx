import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'sonner';

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrintScrap.ai - Scrap Management System",
  description: "Modern scrap management solution for printing companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors expand={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
