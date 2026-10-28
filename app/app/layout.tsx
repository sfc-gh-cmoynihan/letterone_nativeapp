import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "LetterOne 360",
  description: "Governed Data & AI platform for Treasury Operations, Risk, Trading and Direct Lending",
  icons: {
    icon: "/favicon.png?v=l1",
    shortcut: "/favicon.png?v=l1",
    apple: "/favicon.png?v=l1",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
