import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Resilience Buddy — Build your everyday strong",
  description: "Your training, nutrition and progress. One clear plan.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { title: "Resilience Buddy" },
  icons: {
    icon: "/resilience-buddy-icon-192.png",
    apple: "/resilience-buddy-icon-512.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080808",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
