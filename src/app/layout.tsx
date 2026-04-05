import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Palboard | Your Academic Companion",
  description: "A sleek, all-in-one dashboard for engineering students to track SGPA, tasks, and marks.",
  openGraph: {
    title: 'Palboard',
    description: 'Track your academic journey with ease.',
    url: 'https://palboard.vercel.app',
    siteName: 'Palboard',
    images: [
      {
        url: '/og-image.png', // We will add this file to /public later
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
  verification: {
    google: 'CdmcWfCRwyF5AEIbCrHK7XN8BgZcZ7D3uSG_nksuk1M',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
