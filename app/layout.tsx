import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTubeWrap',
  description: 'Analyze your YouTube history locally',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
