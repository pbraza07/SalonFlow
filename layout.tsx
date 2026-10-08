import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalonFlow | Hair & Barber Studio",
  description: "Your studio, beautifully in sync. Booking, calendar, clients and front desk.",
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
