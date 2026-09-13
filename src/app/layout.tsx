import type { Metadata } from "next";
import { Instrument_Sans, Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/Providers";
import KeyboardHelp from "@/components/KeyboardHelp";
import { AppFooter } from "@/components/AppFooter";
import "./globals.css";

// Body / UI font
const instrumentSans = Instrument_Sans({
  variable: "--font-sans-var",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Display / heading font
const bricolage = Bricolage_Grotesque({
  variable: "--font-display-var",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Roofactor",
  description: "Roof surface area estimation tool",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roofactor",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <AppFooter />
          <KeyboardHelp />
        </Providers>
      </body>
    </html>
  );
}
