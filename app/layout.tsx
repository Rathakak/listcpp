import type {Metadata} from 'next';
import { Kantumruy_Pro, Moul } from 'next/font/google';
import './globals.css';

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-kantumruy',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const moul = Moul({
  subsets: ['khmer'],
  variable: '--font-moul',
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យបញ្ជីឈ្មោះ (Google Sheets)',
  description: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យបញ្ជីឈ្មោះសមាជិក គជប និងស្ថិតិគ្រួសារ ដូចទៅនឹង Google Sheets & Excel ជាមួយមុខងារ Print របាយការណ៍ផ្លូវការ',
  openGraph: {
    title: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យបញ្ជីឈ្មោះ (Google Sheets)',
    description: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យបញ្ជីឈ្មោះសមាជិក គជប និងស្ថិតិគ្រួសារ ដូចទៅនឹង Google Sheets & Excel ជាមួយមុខងារ Print របាយការណ៍ផ្លូវការ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យបញ្ជីឈ្មោះ (Google Sheets)',
    description: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យបញ្ជីឈ្មោះសមាជិក គជប និងស្ថិតិគ្រួសារ ដូចទៅនឹង Google Sheets & Excel ជាមួយមុខងារ Print របាយការណ៍ផ្លូវការ',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="km" className={`${kantumruy.variable} ${moul.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-slate-900 bg-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

