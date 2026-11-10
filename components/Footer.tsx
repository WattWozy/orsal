'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-steel-900 text-steel-100 border-t border-steel-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <span className="text-2xl font-black tracking-tight text-white block mb-4">
            ORSAL<span className="text-brand-accent">.</span>
          </span>
          <p className="text-xs text-steel-500 leading-relaxed mb-4">
            Cercados Metálicos Orsal S.L.L. <br />
            Fabricación e instalación de cerramientos, verjas y automatismos. Certificación ISO 9001.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Secciones</h4>
          <ul className="space-y-2 text-xs text-steel-500">
            <li><Link href="/productos" className="hover:text-white">Cercados y Mallas</Link></li>
            <li><Link href="/productos" className="hover:text-white">Verjas Rígidas</Link></li>
            <li><Link href="/productos" className="hover:text-white">Puertas y Automática</Link></li>
            <li><Link href="/productos" className="hover:text-white">Instalaciones Deportivas</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contacto</h4>
          <ul className="space-y-2 text-xs text-steel-500">
            <li>Polígono Industrial Morea Sur, Nave 69</li>
            <li>31191 Beriáin, Navarra</li>
            <li className="pt-2 text-white font-medium">+34 948 31 05 02</li>
            <li className="text-white font-medium">info@cercadosorsal.com</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Calidad</h4>
          <p className="text-xs text-steel-500 leading-relaxed">
            Empresa acreditada por ENAC y LGAI Technological Center para la fabricación y montaje de cierres y puertas metálicas.
          </p>
        </div>
      </div>

      <div className="border-t border-steel-800 py-6 text-center text-xs text-steel-500">
        &copy; {currentYear} Cercados Orsal S.L.L. Todos los derechos reservados.
      </div>
    </footer>
  );
}