import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SiteSettingsProvider } from "@/lib/site-settings";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                if (!localStorage.getItem('theme')) {
                  localStorage.setItem('theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={geist.className}>
        <ThemeProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" richColors expand={false} />
            </AuthProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
