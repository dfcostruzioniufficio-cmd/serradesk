import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Scissors } from 'lucide-react';

export default function CTAWidget() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-[#0a101d] border border-blue-500/30 p-8 md:p-12 shadow-[0_20px_50px_rgba(59,130,246,0.1)] my-12 group">
      {/* Effetti di background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-blue-500/20" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-violet-500/20" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm font-bold mb-4">
            <Scissors size={14} /> Soluzione Automatica
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            Stai ancora perdendo le <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">serate su Excel?</span>
          </h3>
          <p className="text-slate-300 text-lg md:text-xl font-light">
            Smetti di calcolare a mano. Prova il nostro generatore gratuito di distinte di taglio in 60 secondi ed elimina il rischio di errori.
          </p>
        </div>
        
        <div className="shrink-0">
          <Link 
            to="/preventivi" 
            className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-black px-8 py-4 rounded-full text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
          >
            Provalo gratis ora
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
