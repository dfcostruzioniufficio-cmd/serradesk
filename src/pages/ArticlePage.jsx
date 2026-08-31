import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import frontMatter from 'front-matter';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import SEOManager from '../components/SEOManager';
import CTAWidget from '../components/CTAWidget';

// Importa tutti i file markdown come raw text
const markdownFiles = import.meta.glob('../content/guides/*.md', { query: '?raw', import: 'default' });

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const filePath = `../content/guides/${slug}.md`;
        
        if (markdownFiles[filePath]) {
          const content = await markdownFiles[filePath]();
          const parsed = frontMatter(content);
          setArticle(parsed);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Error loading article", e);
        setError(true);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-center px-6">
        <h1 className="text-4xl font-black text-white mb-4">Articolo non trovato</h1>
        <p className="text-slate-400 mb-8">La guida che stai cercando non esiste o è stata spostata.</p>
        <Link to="/guida" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 font-medium">
          <ArrowLeft size={16} /> Torna all'Hub Risorse
        </Link>
      </div>
    );
  }

  const { attributes, body } = article;

  return (
    <main className="min-h-screen bg-[#070b14] pb-20">
      <SEOManager 
        title={attributes.title} 
        description={attributes.description} 
        path={`/guida/${slug}`} 
      />

      {/* Header Articolo */}
      <div className="relative pt-32 pb-16 px-6 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <Link to="/guida" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-8">
            <ArrowLeft size={16} /> Torna alle Guide
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.2] tracking-tight mb-6">
            {attributes.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 font-medium">
            {attributes.date && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                <span>{attributes.date}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User size={16} className="text-violet-400" />
              <span>Redazione SerraDesk</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              <span>{Math.ceil(body.split(' ').length / 200)} min lettura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto Articolo */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h3:text-2xl prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-img:rounded-2xl prose-img:shadow-2xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {body}
          </ReactMarkdown>
        </div>
        
        {/* CTA Finale */}
        <CTAWidget />
      </article>
    </main>
  );
}
