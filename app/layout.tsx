import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyBoss Project Status Dashboard",
  description: "Internal project and repository status dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}