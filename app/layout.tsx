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
  title: 'ប្រព័ន្ធគ្រប់សមាជិកគណបក្សឃុំបន្ទាយស្ទោង',
  description: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យសមាជិកគណបក្សប្រជាជនកម្ពុជា ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ជាមួយ Google Sheets Format របាយការណ៍បោះពុម្ព A4 ផ្លូវការ ទម្រង់របាយការណ៍ប្រជាសាស្ត្រ (សម្រាល និង មរណៈ) និងតារាងរចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សឃុំ-ភូមិ (មានរូបថត)',
  icons: {
    icon: '/cpp-logo.png',
  },
  openGraph: {
    title: 'ប្រព័ន្ធគ្រប់សមាជិកគណបក្សឃុំបន្ទាយស្ទោង',
    description: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យសមាជិកគណបក្សប្រជាជនកម្ពុជា ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ជាមួយ Google Sheets Format របាយការណ៍បោះពុម្ព A4 ផ្លូវការ ទម្រង់របាយការណ៍ប្រជាសាស្ត្រ (សម្រាល និង មរណៈ) និងតារាងរចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សឃុំ-ភូមិ (មានរូបថត)',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ប្រព័ន្ធគ្រប់សមាជិកគណបក្សឃុំបន្ទាយស្ទោង',
    description: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យសមាជិកគណបក្សប្រជាជនកម្ពុជា ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ជាមួយ Google Sheets Format របាយការណ៍បោះពុម្ព A4 ផ្លូវការ ទម្រង់របាយការណ៍ប្រជាសាស្ត្រ (សម្រាល និង មរណៈ) និងតារាងរចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សឃុំ-ភូមិ (មានរូបថត)',
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

