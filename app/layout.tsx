import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SelahFlow | Smart booking & AI receptionist.",
  description: "Your bookings flow. You breathe. Smart booking & AI receptionist.",
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SelahFlow' },
  icons: {
    icon: [{ url: "/brand/app-icon.svg?v=1.3.11", type: "image/svg+xml" }],
    shortcut: "/brand/app-icon.svg?v=1.3.11",
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
