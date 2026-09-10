import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worldseed",
  description: "Plant a seed. Grow a living micro-world.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 bg-world-glow antialiased">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </div>
      </body>
    </html>
  );
}
