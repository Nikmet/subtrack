import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import { ToasterProvider } from "@/app/components/toast/toaster-provider";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "SubTrack",
  description: "Учет и анализ ваших подписок",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${roboto.variable} antialiased`}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
