import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar viral",
  description: "Lo más viral ahora en España, Inglaterra, Francia y Estados Unidos, sin política ni deportes.",
  robots: { index: false, follow: false },
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="es">
    <body>{children}</body>
  </html>
);

export default RootLayout;
