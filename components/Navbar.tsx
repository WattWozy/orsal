'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900">
            ORSAL<span className="text-amber-500">.</span>
          </span>
          <span className="text-xs uppercase tracking-widest text-slate-600 font-semibold border-l border-slate-300 pl-2">
            Cercados Metálicos
          </span>
        </Link>

        {/* Enlaces de navegación con texto oscuro y alto contraste */}
        <nav className="hidden md:flex gap-8 items-center text-sm font-semibold text-slate-800">
          <Link href="/" className="hover:text-amber-600 transition-colors">Inicio</Link>
          <Link href="/productos" className="hover:text-amber-600 transition-colors">Productos y Servicios</Link>
          <Link href="/empresa" className="hover:text-amber-600 transition-colors">Empresa</Link>
          <Link href="/proyectos" className="hover:text-amber-600 transition-colors">Proyectos</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link 
            href="/contacto" 
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-500 hover:text-slate-950 transition-colors shadow-sm"
          >
            Solicitar Presupuesto
          </Link>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="md:hidden p-2 text-slate-900"
          aria-label="Abrir Menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 text-slate-900">
          <Link 
            href="/" 
            onClick={() => setIsOpen(false)} 
            className="block py-2 text-sm font-medium"
          >
            Inicio
          </Link>
          <Link 
            href="/productos" 
            onClick={() => setIsOpen(false)} 
            className="block py-2 text-sm font-medium"
          >
            Productos y Servicios
          </Link>
          <Link 
            href="/empresa" 
            onClick={() => setIsOpen(false)} 
            className="block py-2 text-sm font-medium"
          >
            Empresa
          </Link>
          <Link 
            href="/proyectos" 
            onClick={() => setIsOpen(false)} 
            className="block py-2 text-sm font-medium"
          >
            Proyectos
          </Link>
          <Link 
            href="/contacto" 
            onClick={() => setIsOpen(false)} 
            className="block w-full text-center bg-amber-500 text-slate-950 py-2.5 rounded-lg font-bold text-sm"
          >
            Contactar
          </Link>
        </div>
      )}
    </header>
  );
}