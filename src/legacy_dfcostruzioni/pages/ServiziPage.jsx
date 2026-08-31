import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import BenefitsList from '@/components/BenefitsList.jsx';
function ServiziPage() {
  const serramentiFeatures = ['Isolamento termico certificato - riduzione dispersione calore fino al 70%', 'Isolamento acustico superiore - abbattimento rumori esterni fino a 42 dB', 'Risparmio energetico garantito - riduzione costi riscaldamento/raffrescamento', 'Posa certificata a regola d\'arte secondo normativa UNI 11673-1', 'Soluzioni personalizzate su misura per ogni esigenza', 'Materiali di prima qualità con garanzia estesa', 'Manutenzione ridotta e lunga durata nel tempo'];
  const carpenteriaFeatures = ['Lavorazione artigianale con attenzione ai dettagli', 'Saldature certificate e controlli di qualità rigorosi', 'Materiali ad alta resistenza e durabilità', 'Trattamenti anticorrosione e verniciature professionali', 'Progettazione personalizzata su misura', 'Installazione sicura e a norma di legge', 'Assistenza post-vendita e manutenzione programmata'];
  return <>
      <Helmet>
        <title>Servizi - Serramenti e Carpenteria | DF COSTRUZIONI SRL</title>
        <meta name="description" content="Serramenti in PVC e alluminio con isolamento certificato. Carpenteria metallica artigianale su misura. Posa a regola d'arte e garanzia di qualità da DF COSTRUZIONI SRL." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="py-16 bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6
            }} className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">I nostri servizi</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Soluzioni professionali per migliorare comfort, sicurezza ed efficienza energetica della tua casa o azienda.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-24">
                <motion.div initial={{
                opacity: 0,
                x: -30
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.6
              }} className="order-2 md:order-1">
                  <div className="grid grid-cols-2 gap-4">
                    <img src="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/e1bd72d516ff7659afd20220603a8f4d.png" alt="Profilo PVC doppio vetro - DF COSTRUZIONI SRL" className="rounded-2xl shadow-lg w-full h-full object-cover col-span-2" />
                    <img src="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/84480c0915e47fcf5b5c718e38392f1f.jpg" alt="Profilo alluminio taglio termico - DF COSTRUZIONI SRL" className="rounded-2xl shadow-lg w-full h-full object-cover" />
                    <img src="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/38d0d6ef9bea3bc5fba2cd16aec8b196.png" alt="Profilo alluminio nero - DF COSTRUZIONI SRL" className="rounded-2xl shadow-lg w-full h-full object-cover" />
                  </div>
                </motion.div>

                <motion.div initial={{
                opacity: 0,
                x: 30
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.6
              }} className="order-1 md:order-2">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Serramenti in PVC e Alluminio</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Sostituisci i tuoi vecchi infissi con sistemi moderni ad alta efficienza. I nostri serramenti garantiscono isolamento termico e acustico superiore, riducendo i costi energetici e migliorando il comfort abitativo.
                  </p>
                  
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Vantaggi principali</h3>
                    <BenefitsList benefits={serramentiFeatures} />
                  </div>

                  <div className="bg-muted rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-3">Specifiche tecniche</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Profili PVC multi-camera con rinforzi in acciaio</li>
                      <li>• Vetrocamera basso-emissiva con gas argon</li>
                      <li>• Ferramenta di sicurezza anti-effrazione</li>
                      <li>• Guarnizioni EPDM per tenuta perfetta</li>
                    </ul>
                  </div>

                  <Button asChild size="lg" className="group">
                    <Link to="/contatti">
                      Richiedi Preventivo
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <motion.div initial={{
                opacity: 0,
                x: -30
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.6
              }}>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Carpenteria Metallica Artigianale</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Realizziamo strutture metalliche su misura con lavorazione artigianale. Dalla progettazione alla posa in opera, ogni dettaglio è curato per garantire sicurezza, robustezza e qualità estetica.
                  </p>
                  
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Vantaggi principali</h3>
                    <BenefitsList benefits={carpenteriaFeatures} />
                  </div>

                  <div className="bg-muted rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-3">Lavorazioni disponibili</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Cancelli e recinzioni in ferro battuto</li>
                      <li>• Scale e ringhiere di sicurezza</li>
                      <li>• Strutture portanti e pensiline</li>
                      <li>• Inferriate e grate di protezione</li>
                    </ul>
                  </div>

                  <Button asChild size="lg" className="group">
                    <Link to="/contatti">
                      Richiedi Preventivo
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>

                <motion.div initial={{
                opacity: 0,
                x: 30
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.6
              }} className="relative">
                  <img src="https://horizons-cdn.hostinger.com/6d1b1b5f-08e4-4b2c-8c09-80fe665c9ea1/gemini_generated_image_f0o7bhf0o7bhf0o7-2-wAuN7.jpg" alt="Steel metal joint detail with black steel and bolts in industrial environment" className="rounded-2xl shadow-2xl w-full h-auto" />
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>;
}
export default ServiziPage;