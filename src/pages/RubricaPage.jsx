import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Search, Edit, Trash2, FileText, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function RubricaPage() {
  const { session } = useUser();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  // State per lo storico preventivi
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);
  const [clientOrders, setClientOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const user = session?.user;
    if (!user) return;
    
    const { data, error } = await supabase
      .from('clienti')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
      
    if (!error && data) {
      setClients(data);
    }
    setIsLoading(false);
  };

  const handleSaveClient = async () => {
    const user = session?.user;
    if (!user || !editingClient?.name?.trim()) return;

    const payload = {
      user_id: user.id,
      name: editingClient.name.trim(),
      vat: editingClient.vat || '',
      phone: editingClient.phone || '',
      address: editingClient.address || '',
      email: editingClient.email || ''
    };

    if (editingClient.id) {
      await supabase.from('clienti').update(payload).eq('id', editingClient.id);
    } else {
      await supabase.from('clienti').insert([payload]);
    }
    
    await fetchClients();
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo cliente?")) {
      await supabase.from('clienti').delete().eq('id', id);
      fetchClients();
    }
  };

  const openClientHistory = async (client) => {
    setSelectedClientHistory(client);
    setIsLoadingOrders(true);
    
    const user = session?.user;
    if (!user) return;

    // Cerca ordini che matchano il nome cliente esatto
    const { data, error } = await supabase
      .from('ordini')
      .select('*')
      .eq('user_id', user.id)
      .ilike('cliente', client.name)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClientOrders(data);
    }
    setIsLoadingOrders(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.vat && c.vat.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1a365d] flex items-center gap-3">
              <Users className="text-blue-600" size={28} /> Rubrica Clienti
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gestisci le anagrafiche e visualizza lo storico ordini</p>
          </div>
          <Button onClick={() => { setEditingClient({ name: '' }); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
            + Nuovo Cliente
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <Input 
              placeholder="Cerca cliente per nome o partita IVA..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Caricamento rubrica...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4">Azienda / Cliente</th>
                    <th className="px-6 py-4">Contatti</th>
                    <th className="px-6 py-4">Dati Fiscali</th>
                    <th className="px-6 py-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {c.phone && <div>📞 {c.phone}</div>}
                        {c.email && <div>✉️ {c.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {c.vat && <div>P.IVA: {c.vat}</div>}
                        {c.address && <div className="text-xs truncate max-w-[200px] mt-1">{c.address}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openClientHistory(c)} className="text-indigo-600 hover:bg-indigo-50">
                            <FileText size={16} className="mr-1"/> Storico
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingClient(c); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50">
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">
                        Nessun cliente trovato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODALE INSERIMENTO / MODIFICA CLIENTE */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient?.id ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nome Azienda / Cliente *</Label>
              <Input value={editingClient?.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>P.IVA / C.F.</Label>
                <Input value={editingClient?.vat || ''} onChange={e => setEditingClient({...editingClient, vat: e.target.value})} />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={editingClient?.phone || ''} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editingClient?.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
            </div>
            <div>
              <Label>Indirizzo Completo</Label>
              <Input value={editingClient?.address || ''} onChange={e => setEditingClient({...editingClient, address: e.target.value})} />
            </div>
            <Button onClick={handleSaveClient} className="w-full mt-4" disabled={!editingClient?.name?.trim()}>
              Salva in Rubrica
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODALE STORICO PREVENTIVI */}
      <Dialog open={!!selectedClientHistory} onOpenChange={(open) => !open && setSelectedClientHistory(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex flex-col gap-1">
              <span className="text-xl">Storico: {selectedClientHistory?.name}</span>
              <span className="text-xs font-normal text-gray-500">
                P.IVA: {selectedClientHistory?.vat || 'N/D'} | {selectedClientHistory?.phone || 'Nessun tel.'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 py-4 pr-2 custom-scrollbar">
            {isLoadingOrders ? (
              <p className="text-center text-gray-500 my-8">Ricerca ordini in corso...</p>
            ) : clientOrders.length === 0 ? (
              <div className="text-center bg-gray-50 p-8 rounded-xl border border-dashed my-4">
                <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500">Nessun preventivo registrato per questo cliente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-green-50 text-green-800 p-3 rounded-lg border border-green-200 mb-4">
                  <span className="font-semibold text-sm">Totale Fatturato (Confermato):</span>
                  <span className="font-bold text-lg">
                    € {clientOrders.filter(o => o.stato === 'Confermato' || o.stato === 'In Produzione' || o.stato === 'Consegnato').reduce((acc, o) => acc + (o.totale || 0), 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {clientOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-all bg-white">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">Preventivo del {new Date(order.created_at).toLocaleDateString('it-IT')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          order.stato === 'Confermato' ? 'bg-green-100 text-green-700' : 
                          order.stato?.includes('Bozza') ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.stato || 'Bozza'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.items?.length || 0} articoli | Sconto applicato: {order.sconto || 0}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">€ {(order.totale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
