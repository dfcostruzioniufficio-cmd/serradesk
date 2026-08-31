
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BenefitsList from './BenefitsList';

function ServiceCard({ icon: Icon, title, description, benefits, ctaText, ctaLink }) {
  return (
    <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:border-primary/40 border border-transparent transition-all duration-500 flex flex-col h-full relative overflow-hidden group cursor-pointer">
      {/* Sfumatura decorativa interna che appare all'hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-sm">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors duration-300">{title}</h3>
      </div>
      
      {description && (
        <p className="text-muted-foreground mb-6 leading-relaxed relative z-10">
          {description}
        </p>
      )}
      
      {benefits && benefits.length > 0 && (
        <div className="mb-8 relative z-10">
          <BenefitsList benefits={benefits} />
        </div>
      )}
      
      <div className="mt-auto relative z-10">
        <Button asChild className="w-full group/btn shadow-md hover:shadow-primary/30 transition-all duration-300">
          <Link to={ctaLink}>
            {ctaText}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default ServiceCard;
