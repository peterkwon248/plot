import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "@/components/ui/BottomNav";

export const metadata: Metadata = {
  title: "닫다 (datda)",
  description: "느리지만 분명한 성취 도구. 매일 하나를 닫는다.",
  keywords: ["productivity", "OMCL", "closure", "mindful", "datda"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "닫다",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "닫다 (datda)",
    description: "느리지만 분명한 성취 도구. 매일 하나를 닫는다.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <main className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
          {children}
        </main>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
