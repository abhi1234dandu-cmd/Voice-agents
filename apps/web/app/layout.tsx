import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Votell | AI voice agents for high-call-volume teams",
  description:
    "Build, test, and monitor AI voice agents for motels, restaurants, call centers, and factory operations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
