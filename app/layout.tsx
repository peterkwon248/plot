import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plot — Plot your life",
  description: "Personal issue tracker for life",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
