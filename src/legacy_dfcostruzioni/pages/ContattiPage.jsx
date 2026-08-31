
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ContactForm from '@/components/ContactForm.jsx';

function ContattiPage() {
  const whatsappNumber = '393387543080';
  const whatsappMessage = 'Ciao, vorrei informazioni sui vostri servizi.';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Sede',
      content: 'Giugliano in Campania, NA',
      link: null
    },
    {
      icon: Phone,
      title: 'Telefono',
      content: '+39 338 754 3080',
      link: 'tel:+393387543080'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@dfcostruzionisrl.net',
      link: 'mailto:info@dfcostruzionisrl.net'
    },
    {
      icon: Clock,
      title: 'Orari',
      content: 'Lun-Ven: 8:00-18:00\nSab: 8:00-13:00',
      link: null
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contatti - Richiedi Preventivo Gratuito | DF COSTRUZIONI SRL</title>
        <meta name="description" content="Contatta DF COSTRUZIONI SRL per un preventivo gratuito. Serramenti in PVC e alluminio, carpenteria metallica. Giugliano in Campania, NA. P.IVA 08875791215." />
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
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Contattaci</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Richiedi un preventivo gratuito e senza impegno. Il nostro team è pronto ad aiutarti.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl font-bold mb-8">Richiedi un preventivo</h2>
                  <ContactForm />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl font-bold mb-8">Informazioni di contatto</h2>
                  
                  <div className="space-y-6 mb-8">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <info.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{info.title}</h3>
                          {info.link ? (
                            <a href={info.link} className="text-muted-foreground hover:text-primary transition-colors whitespace-pre-line">
                              {info.content}
                            </a>
                          ) : (
                            <p className="text-muted-foreground whitespace-pre-line">{info.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted rounded-2xl p-8 mb-8">
                    <h3 className="text-xl font-semibold mb-4">Dati aziendali</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p><span className="font-medium text-foreground">Ragione Sociale:</span> DF COSTRUZIONI SRL</p>
                      <p><span className="font-medium text-foreground">P.IVA:</span> 08875791215</p>
                      <p><span className="font-medium text-foreground">Sede:</span> Giugliano in Campania, NA</p>
                    </div>
                  </div>

                  <div className="bg-accent text-accent-foreground rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageCircle className="w-8 h-8" />
                      <h3 className="text-xl font-semibold">Contatto rapido WhatsApp</h3>
                    </div>
                    <p className="mb-6 text-accent-foreground/90">
                      Hai bisogno di una risposta immediata? Scrivici su WhatsApp e ti risponderemo il prima possibile.
                    </p>
                    <Button asChild variant="secondary" size="lg" className="w-full">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Apri Chat WhatsApp
                      </a>
                    </Button>
                  </div>
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

export default ContattiPage;
