import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SelahFlow | Smart booking & AI receptionist.",
  description: "Your bookings flow. You breathe. Smart booking & AI receptionist.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
