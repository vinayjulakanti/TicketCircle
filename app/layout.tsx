
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "TicketCircle",
  description:
    "Discover train and bus tickets, connect with travellers, and explore your next journey with TicketCircle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Suspense fallback={null}>
            {children}
          </Suspense>
          <FeedbackButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
