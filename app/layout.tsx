import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MySOMClasses - Yale SOM Course Picker & Schedule Planner",
  description: "Browse, filter, and schedule courses at Yale School of Management. Interactive calendar view, course search, export to ICS, and share your schedule with classmates.",
  generator: "v0.dev",
  keywords: [
    "Yale SOM",
    "Yale School of Management",
    "course picker",
    "course scheduler",
    "MBA courses",
    "business school courses",
    "Yale courses",
    "schedule planner",
  ],
  authors: [{ name: "MySOMClasses" }],
  creator: "MySOMClasses",
  publisher: "MySOMClasses",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "https://som.yale.edu/themes/custom/som/images/favicons/favicon.ico",
  },
  metadataBase: new URL('https://mysomclasses.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mysomclasses.com',
    siteName: 'MySOMClasses',
    title: 'MySOMClasses - Yale SOM Course Picker & Schedule Planner',
    description: 'Browse, filter, and schedule courses at Yale School of Management. Interactive calendar view, course search, export to ICS, and share your schedule.',
    images: [
      {
        url: 'https://mysomclasses.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MySOMClasses - Yale SOM Course Picker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MySOMClasses - Yale SOM Course Picker',
    description: 'Browse, filter, and schedule courses at Yale School of Management.',
    images: ['https://mysomclasses.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://mysomclasses.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {children}
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
