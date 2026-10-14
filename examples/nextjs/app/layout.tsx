import type { Metadata } from "next"
import "@santaka-ui/tokens/css/light.css"
import "@santaka-ui/tokens/css/dark.css"
import "@santaka-ui/web-components/santaka.css"

export const metadata: Metadata = {
  title: "Santaka UI — Next.js SSR proof",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
