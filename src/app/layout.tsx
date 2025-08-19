import type { Metadata } from "next";
import "./globals.css";
import { NetworkProvider } from "@/contexts/networkcontext";

export const metadata: Metadata = {
  title: "Composable Scan",
  description: "Scan the Espresso Network in real-time",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased font-sans"
      >
        <NetworkProvider>
          {children}
        </NetworkProvider>
      </body>
    </html>
  );
}
