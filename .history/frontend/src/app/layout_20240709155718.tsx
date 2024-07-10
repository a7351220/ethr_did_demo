// app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'DID Demo App',
  description: 'Decentralized Identity for Everyone',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-blue-600 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}