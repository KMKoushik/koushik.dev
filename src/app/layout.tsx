import "./globals.css";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Koushik Mohan — Software Engineer",
  description:
    "Personal website of Koushik Mohan. Software engineer crafting reliable, performant, and thoughtfully designed products.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${mono.className} antialiased`}>{children}</body>
    </html>
  );
}
