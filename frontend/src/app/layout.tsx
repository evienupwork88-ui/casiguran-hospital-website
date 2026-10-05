import type { Metadata } from "next";
import { Allura, Geist, Geist_Mono } from "next/font/google";
import { NotificationProvider } from "@/components/providers/notification-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const scriptFont = Allura({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const siteName = "Casiguran District Hospital";
const siteDescription =
  "Official website of Casiguran District Hospital, Provincial Government of Aurora. Hospital services, news, announcements, events, and contact information.";

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL in your production env (e.g. https://your-domain.gov.ph)
  // so that Open Graph image URLs resolve to absolute links.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  icons: {
    icon: "/cdh-logo-circle.png",
    apple: "/cdh-logo-circle.png",
  },
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    locale: "en_PH",
    images: [{ url: "/cdh-logo-circle.png", alt: `${siteName} logo` }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${scriptFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}