
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceTypeChange = (value) => {
    setFormData(prev => ({ ...prev, serviceType: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione dei campi obbligatori (escluso il telefono)
    if (!formData.name || !formData.email || !formData.serviceType || !formData.message) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Inserisci un indirizzo email valido');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nome: formData.name,
        email: formData.email,
        servizio: formData.serviceType,
        messaggio: formData.message,
      };

      // Includi il telefono solo se fornito
      if (formData.phone && formData.phone.trim() !== '') {
        payload.telefono = formData.phone.trim();
      }

      await pb.collection('preventivi').create(payload, { $autoCancel: false });

      toast.success('Preventivo inviato con successo!');
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        serviceType: '',
        message: ''
      });

      // Scroll verso l'alto
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error("Errore invio preventivo:", error);
      toast.error(error.message || 'Errore durante l\'invio. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Nome e Cognome *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-2 text-foreground"
          placeholder="Mario Rossi"
        />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-2 text-foreground"
          placeholder="mario.rossi@example.com"
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefono (Opzionale)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          className="mt-2 text-foreground"
          placeholder="+39 338 754 3080"
        />
      </div>

      <div>
        <Label htmlFor="serviceType">Tipo di Servizio *</Label>
        <Select value={formData.serviceType} onValueChange={handleServiceTypeChange} required>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Seleziona un servizio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="serramenti-pvc">Serramenti in PVC</SelectItem>
            <SelectItem value="serramenti-alluminio">Serramenti in Alluminio</SelectItem>
            <SelectItem value="carpenteria">Carpenteria Metallica</SelectItem>
            <SelectItem value="altro">Altro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Messaggio *</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="mt-2 text-foreground"
          placeholder="Descrivi il tuo progetto o le tue esigenze..."
        />
      </div>

      <Button 
        type="submit" 
        className="w-full group" 
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? (
          'Invio in corso...'
        ) : (
          <>
            Invia Richiesta
            <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
}

export default ContactForm;
