import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'snow day calculator pro',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <GoogleAnalytics />
      <body>{children}</body>
    </html>
  )
}
