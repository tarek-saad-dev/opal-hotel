import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";
import "./premium-sections.css";
import "./premium-closing.css";
import "./visual-polish.css";
import "./hero-video.css";
import "./media-studio.css";
import "./mobile-navigation.css";
import "./route-polish.css";
import "./section-rhythm.css";
import "./overview-video.css";
import "./date-picker.css";
import "./route-loading-motion.css";
import { RouteLoadingProvider } from "@/components/RouteLoadingProvider";

export const metadata: Metadata = {
  title: { default: "Opal Legacy Luxor Hotel", template: "%s | Opal Legacy" },
  description: "Explore Opal Legacy Luxor Hotel, its amenities, location, and photographs.",
  robots: { index: false, follow: false }, // Turn on only after content, ownership and booking verification.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head>
    <link rel="preconnect" href="https://images.unsplash.com"/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
  </head><body><RouteLoadingProvider>{children}</RouteLoadingProvider></body></html>;
}
