import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { InstallPrompt } from "@/components/app/install-prompt";
import { GlobalBackControl } from "@/components/app/global-back-control";
import { ServiceWorkerRegister } from "@/components/app/service-worker-register";
import { ToasterWrapper } from "@/components/app/toaster-wrapper";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E8E1D5" },
    { color: "#14110F" },
  ],
};

const defaultUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "FamilyFinance",
    template: "%s | FamilyFinance",
  },
  description: "Painel financeiro familiar para controle de gastos, contas, bancos e permissões.",
  applicationName: "FamilyFinance",
  icons: {
    apple: [{ url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "FamilyFinance",
    statusBarStyle: "black-translucent",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <GlobalBackControl />
          <ToasterWrapper />
          <ServiceWorkerRegister />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
