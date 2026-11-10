import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cercados Orsal | Fabricación e Instalación de Cercados Metálicos',
  description: 'Especialistas en fabricación y montaje de cercados metálicos, verjas, puertas y automatismos en Navarra. Certificación ISO 9001.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light scroll-smooth" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} bg-white text-industrial-900 antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}