import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClearCost Dental | AI Insurance & Pre-Treatment Estimator',
  description: 'Instant dental insurance EOB parsing and patient out-of-pocket cost estimation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}