import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edge CMS Lab",
  description: "Cloudflare-native CMS"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
