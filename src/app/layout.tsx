import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";

export const metadata: Metadata = {
  title: { default: "Opal Legacy Luxor Hotel", template: "%s | Opal Legacy" },
  description: "Explore Opal Legacy Luxor Hotel, its amenities, location, and photographs.",
  robots: { index: false, follow: false }, // Turn on only after content, ownership and booking verification.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html suppressHydrationWarning><body>{children}</body></html>;
}
