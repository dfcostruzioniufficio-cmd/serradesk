
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Shield, Wrench } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ServiceCard from '@/components/ServiceCard.jsx';

function HomePage() {
  const whatsappNumber = '393387543080';
  const whatsappMessage = 'Ciao, vorrei un preventivo gratuito.';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const services = [
    {
      icon: Shield,
      title: 'Serramenti in PVC e Alluminio',
      description: 'Soluzioni moderne per isolamento termico e acustico superiore.',
      benefits: [
        'Isolamento termico certificato',
        'Riduzione rumori esterni',
        'Risparmio energetico garantito',
        'Posa certificata a regola d\'arte'
      ],
      ctaText: 'Scopri di più',
      ctaLink: '/servizi'
    },
    {
      icon: Wrench,
      title: 'Carpenteria Metallica Artigianale',
      description: 'Lavorazioni su misura con attenzione ai dettagli e massima sicurezza.',
      benefits: [
        'Sicurezza e robustezza',
        'Lavorazione artigianale',
        'Dettagli di qualità',
        'Soluzioni personalizzate'
      ],
      ctaText: 'Scopri di più',
      ctaLink: '/servizi'
    }
  ];

  return (
    <>
      <Helmet>
        <title>D.F. Costruzioni S.r.l. | Infissi in PVC e Alluminio a Giugliano</title>
        <meta name="description" content="Specialisti in serramenti a taglio termico, infissi in PVC e alluminio. Qualità e professionalità per la tua casa a Giugliano in Campania. Richiedi un preventivo gratuito." />
        <meta name="keywords" content="infissi PVC, infissi alluminio, serramenti, taglio termico, Giugliano, costruzioni, finestre" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="D.F. Costruzioni S.r.l. - Infissi e Serramenti" />
        <meta property="og:description" content="Specialisti in infissi in PVC e alluminio a Giugliano in Campania" />
        <meta property="og:image" content="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/e372d9e30cfbf9f45e3465370378e6ff.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : 'https://dfcostruzioni.it'} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: 'url(https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/820ab77446296554b373d9ca9b95eab4.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 via-secondary/70 to-primary/60"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative overflow-hidden"
              >
                {/* Sfumatura interna al box per maggior contrasto */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/5 pointer-events-none z-0"></div>
                
                <div className="relative z-10">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-md" style={{ letterSpacing: '-0.02em' }}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Più luce, più isolamento,</span> zero spifferi.
                  </h1>
                  <p className="text-xl md:text-2xl text-white/95 mb-10 leading-relaxed max-w-3xl mx-auto drop-shadow-sm font-medium">
                    Sostituisci i tuoi vecchi infissi con sistemi moderni in PVC e Alluminio. Migliora l'efficienza della tua casa con la qualità di un'installazione artigianale garantita da DF COSTRUZIONI SRL.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="text-lg px-8 py-6 group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/30 transition-all duration-300">
                      <Link to="/contatti">
                        Richiedi Preventivo Gratuito
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:shadow-lg transition-all duration-300">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Contatto Rapido WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">I nostri servizi</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Soluzioni professionali per migliorare comfort, sicurezza ed efficienza energetica della tua casa.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {services.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <ServiceCard {...service} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Esperienza artigianale, qualità certificata</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Da oltre 10 anni, DF COSTRUZIONI SRL offre soluzioni professionali per serramenti e carpenteria metallica. Ogni progetto è seguito con cura artigianale, dalla progettazione all'installazione certificata.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    La nostra posa a regola d'arte garantisce massima efficienza energetica, isolamento acustico e durata nel tempo.
                  </p>
                  <Button asChild size="lg">
                    <Link to="/chi-siamo">
                      Scopri la nostra storia
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <img
                    src="https://images.unsplash.com/photo-1563174378-62b20fb3342d"
                    alt="Interno luminoso con serramenti moderni installati da DF COSTRUZIONI SRL"
                    className="rounded-2xl shadow-2xl w-full h-auto"
                  />
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default HomePage;
