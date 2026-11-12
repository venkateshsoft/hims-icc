import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HIMS-ICC | Implementation Command Center",
  description: "Enterprise healthcare implementation assessment and governance platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
