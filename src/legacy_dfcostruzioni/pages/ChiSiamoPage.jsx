
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Award, Shield, Users } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function ChiSiamoPage() {
  const values = [
    {
      icon: Award,
      title: 'Esperienza artigianale',
      description: 'Oltre 10 anni di esperienza nel settore serramenti e carpenteria metallica, con attenzione ai dettagli e cura artigianale in ogni progetto.'
    },
    {
      icon: Shield,
      title: 'Certificazioni professionali',
      description: 'Posa certificata a regola d\'arte secondo normativa UNI 11673-1. Ogni installazione è garantita e conforme agli standard di qualità più elevati.'
    },
    {
      icon: Users,
      title: 'Impegno verso il cliente',
      description: 'Assistenza personalizzata dalla progettazione all\'installazione. Il tuo comfort e la tua soddisfazione sono la nostra priorità assoluta.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Chi Siamo - La nostra storia | DF COSTRUZIONI SRL</title>
        <meta name="description" content="DF COSTRUZIONI SRL: oltre 10 anni di esperienza artigianale in serramenti e carpenteria metallica. Certificazioni professionali e posa a regola d'arte a Giugliano in Campania." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="py-16 bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Chi siamo</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Esperienza artigianale, qualità certificata e impegno verso l'eccellenza in ogni progetto.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">La nostra storia</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    DF COSTRUZIONI SRL nasce dalla passione per il lavoro artigianale e dalla volontà di offrire soluzioni di qualità superiore nel settore dei serramenti e della carpenteria metallica.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Da oltre 10 anni operiamo nel territorio di Giugliano in Campania e provincia, costruendo la nostra reputazione su tre pilastri fondamentali: competenza tecnica, attenzione ai dettagli e rispetto degli standard di qualità più elevati.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Ogni progetto è seguito personalmente dal nostro team, dalla fase di progettazione fino all'installazione finale. La nostra posa certificata a regola d'arte garantisce massima efficienza energetica, isolamento acustico e durata nel tempo.
                  </p>
                  <Button asChild size="lg" className="group">
                    <Link to="/contatti">
                      Richiedi un Preventivo
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                    src="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/927dfe1eb35445f7b5444b02cb60a198.jpg"
                    alt="Tre finestre alluminio nero installate con vista paesaggio da DF COSTRUZIONI SRL"
                    className="rounded-2xl shadow-2xl w-full h-auto"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">I nostri valori</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Ciò che ci distingue e guida ogni nostro intervento.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {values.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-8 shadow-lg"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <value.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-2xl p-12 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto a migliorare la tua casa?</h2>
                  <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                    Contattaci per un preventivo gratuito e senza impegno. Il nostro team è a tua disposizione per consigliarti la soluzione migliore.
                  </p>
                  <Button asChild size="lg" variant="secondary" className="group">
                    <Link to="/contatti">
                      Richiedi Preventivo Gratuito
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
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

export default ChiSiamoPage;
