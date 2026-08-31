
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/4e8ad300a300106b8d119297ff992e6a.png" 
                alt="DF COSTRUZIONI SRL Logo" 
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold">DF COSTRUZIONI SRL</span>
            </div>
            <p className="text-secondary-foreground/80 leading-relaxed mb-4">
              Specialisti in serramenti e carpenteria metallica artigianale. Qualità e professionalità dal 2010.
            </p>
            <div className="space-y-2 text-sm text-secondary-foreground/70">
              <p>P.IVA: 08875791215</p>
            </div>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Link Rapidi</span>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Home
              </Link>
              <Link to="/servizi" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Servizi
              </Link>
              <Link to="/chi-siamo" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Chi Siamo
              </Link>
              <Link to="/contatti" className="text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Contatti
              </Link>
            </nav>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Contatti</span>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary-foreground/70 flex-shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/80">
                  Giugliano in Campania, NA
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-secondary-foreground/70 flex-shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/80">
                  +39 338 754 3080
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-secondary-foreground/70 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@dfcostruzionisrl.net" className="text-secondary-foreground/80 hover:underline">
                  info@dfcostruzionisrl.net
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/70">
            © {new Date().getFullYear()} DF COSTRUZIONI SRL. Tutti i diritti riservati.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/privacy" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-secondary-foreground/50">•</span>
            <Link to="/termini" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
              Termini di Servizio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
