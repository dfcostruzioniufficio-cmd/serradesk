import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, ChevronRight } from 'lucide-react';
import frontMatter from 'front-matter';
import SEOManager from '../components/SEOManager';

const markdownFiles = import.meta.glob('../content/guides/*.md', { query: '?raw', import: 'default' });

export default function GuidaPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const loadedArticles = [];
      
      for (const path in markdownFiles) {
        const content = await markdownFiles[path]();
        const parsed = frontMatter(content);
        
        // Estrai lo slug dal nome del file
        const fileName = path.split('/').pop();
        const slug = fileName.replace(/\.md$/, '');
        
        loadedArticles.push({
          slug,
          title: parsed.attributes.title || 'Articolo senza titolo',
          description: parsed.attributes.description || '',
          date: parsed.attributes.date || '',
        });
      }
      
      // Ordina per data (più recenti prima) o semplicemente lascia l'ordine di lettura
      loadedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setArticles(loadedArticles);
      setLoading(false);
    };

    fetchArticles();
  }, []);

  return (
    <main className="min-h-screen bg-[#070b14] font-sans">
      <SEOManager 
        title="Hub Risorse e Guide per Serramentisti" 
        description="Le migliori risorse, guide e tutorial per i professionisti del serramento. Scopri come ottimizzare i tuoi preventivi e le distinte di taglio."
        path="/guida" 
      />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070b14]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/preventivi" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 p-[1px]">
                <div className="w-full h-full bg-[#070b14] rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="SerraDesk" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight text-white hidden sm:block">SerraDesk</span>
            </div>
          </div>
          <span className="text-sm text-slate-400 font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            Risorse & Guide
          </span>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm font-bold mb-6">
            <BookOpen size={16} /> SerraDesk Academy
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Hub di Risorse per <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Serramentisti
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Guide pratiche, tutorial e strategie per ottimizzare il tuo lavoro, dai preventivi alle distinte di taglio in officina.
          </p>
        </div>
      </div>

      {/* GRID ARTICOLI */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <Link 
                key={article.slug} 
                to={`/guida/${article.slug}`}
                className="group relative flex flex-col justify-between bg-[#0a101d] border border-white/5 rounded-3xl p-8 hover:bg-[#0d1424] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)]"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen size={24} />
                    </div>
                    {article.date && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
                        <Clock size={12} /> {article.date}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4 line-clamp-2 leading-tight">
                    {article.title}
                  </h2>
                  <p className="text-slate-400 font-light line-clamp-3 mb-8">
                    {article.description}
                  </p>
                </div>
                
                <div className="flex items-center text-blue-400 font-bold text-sm">
                  Leggi l'articolo 
                  <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-2">Nessun articolo trovato</h3>
            <p className="text-slate-400">Stiamo preparando nuove guide. Torna a trovarci presto!</p>
          </div>
        )}
      </div>
    </main>
  );
}
