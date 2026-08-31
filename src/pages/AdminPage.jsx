import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Navigate, Link } from 'react-router-dom';
import { Shield, Users, Crown, Calendar, Search, ArrowLeft, CheckCircle, XCircle, RefreshCw, Edit3, X, Save, Eye } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function AdminPage() {
  const { userProfile, isLoadingSettings } = useUser();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null); // {user_id, trial_ends_at, plan}
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (userProfile?.role === 'admin') fetchAllUsers();
  }, [userProfile]);

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users via API:", error);
      alert("Errore nel caricamento degli utenti. Controlla la console.");
    }
    setIsLoadingUsers(false);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    setSaveMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        plan: editingUser.plan,
        trial_ends_at: editingUser.trial_ends_at,
      })
      .eq('user_id', editingUser.user_id);

    if (error) {
      setSaveMessage({ type: 'error', text: 'Errore: ' + error.message });
    } else {
      setSaveMessage({ type: 'success', text: 'Modifiche salvate!' });
      await fetchAllUsers();
      setTimeout(() => { setEditingUser(null); setSaveMessage(null); }, 1500);
    }
    setIsSaving(false);
  };

  const handleExtendTrial = async (userId, days = 3) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    const { error } = await supabase
      .from('profiles')
      .update({ trial_ends_at: newDate.toISOString(), plan: 'trial' })
      .eq('user_id', userId);
    if (!error) await fetchAllUsers();
  };

  const handleExpireTrial = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ trial_ends_at: '2020-01-01T00:00:00Z' })
      .eq('user_id', userId);
    if (!error) await fetchAllUsers();
  };

  const handleImpersonate = async (targetEmail) => {
    if (!targetEmail || targetEmail === '—') {
      alert("Nessuna email associata a questo utente.");
      return;
    }
    
    if (!window.confirm(`Stai per entrare nell'account di ${targetEmail}. Verrà aperto in una nuova scheda. Procedere?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ targetEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore API');

      if (data.link) {
        try {
          await navigator.clipboard.writeText(data.link);
          alert(`LINK COPIATO NEGLI APPUNTI!\n\nPer non perdere la tua sessione Admin, fai così:\n1. Apri una finestra del browser "In Incognito" (o Navigazione Privata).\n2. Incolla il link che ho appena copiato e premi Invio.\n\nEntrerai istantaneamente nell'account di ${targetEmail}.`);
        } catch (clipboardError) {
          // Fallback se il browser (es. Safari) blocca la copia asincrona
          prompt(`Copia manualmente questo link (Seleziona tutto e fai Copia):\n\nApri poi una finestra in incognito e incollalo per entrare come ${targetEmail}`, data.link);
        }
      }
    } catch (err) {
      alert("Errore impersonificazione: " + err.message);
    }
  };

  if (isLoadingSettings) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }
  if (userProfile?.role !== 'admin') return <Navigate to="/preventivi" />;

  const filteredUsers = users.filter(u =>
    u.user_settings?.[0]?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_settings?.[0]?.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.includes(search)
  );

  const trialActive = users.filter(u => u.plan === 'trial' && new Date(u.trial_ends_at) > new Date()).length;
  const trialExpired = users.filter(u => u.plan === 'trial' && new Date(u.trial_ends_at) < new Date()).length;
  const paid = users.filter(u => u.plan !== 'trial').length;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/preventivi" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                <Shield className="text-red-500" /> Pannello Admin
              </h1>
              <p className="text-gray-500 font-medium">Gestione utenti e abbonamenti SerraDesk</p>
            </div>
          </div>

          {/* STATS */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex flex-col items-center shadow-sm min-w-[80px]">
              <span className="text-xs text-gray-500 font-bold uppercase">Totale</span>
              <span className="text-2xl font-black text-gray-800">{users.length}</span>
            </div>
            <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 flex flex-col items-center shadow-sm min-w-[80px]">
              <span className="text-xs text-amber-600 font-bold uppercase">Trial attivi</span>
              <span className="text-2xl font-black text-amber-600">{trialActive}</span>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-200 flex flex-col items-center shadow-sm min-w-[80px]">
              <span className="text-xs text-red-600 font-bold uppercase">Scaduti</span>
              <span className="text-2xl font-black text-red-600">{trialExpired}</span>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex flex-col items-center shadow-sm min-w-[80px]">
              <span className="text-xs text-green-600 font-bold uppercase">Paganti</span>
              <span className="text-2xl font-black text-green-600">{paid}</span>
            </div>
            <button onClick={fetchAllUsers} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors self-center">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 shadow-sm flex items-center gap-4">
          <Search className="text-gray-400" size={20} />
          <Input type="text" placeholder="Cerca per nome azienda, email o ID..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="border-none shadow-none focus-visible:ring-0 text-lg" />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Azienda / Utente</th>
                <th className="px-6 py-4">Piano</th>
                <th className="px-6 py-4">Scadenza Trial</th>
                <th className="px-6 py-4">Ruolo</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingUsers ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Caricamento utenti...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nessun utente trovato.</td></tr>
              ) : (
                filteredUsers.map((u) => {
                  const companyName = u.user_settings?.[0]?.company_name || 'Azienda non impostata';
                  const email = u.user_settings?.[0]?.email || '—';
                  const isTrialExpired = new Date(u.trial_ends_at) < new Date();
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{companyName}</div>
                        <div className="text-xs text-gray-500">{email}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">ID: {u.user_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          u.plan === 'business' ? 'bg-purple-100 text-purple-700' :
                          u.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className={isTrialExpired ? 'text-red-500' : 'text-green-500'} />
                          <span className={isTrialExpired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString('it-IT') : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin
                          ? <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><Crown size={14} /> Admin</span>
                          : <span className="flex items-center gap-1 text-gray-500 text-xs"><Users size={14} /> User</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {!isAdmin && (
                            <>
                              <button
                                onClick={() => handleImpersonate(email)}
                                className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1.5 rounded-md transition-colors flex items-center gap-1 font-bold"
                                title="Entra nell'account senza password"
                              >
                                <Eye size={12} /> Entra
                              </button>
                              <button
                                onClick={() => handleExtendTrial(u.user_id, 3)}
                                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                title="Estendi trial di 3 giorni"
                              >
                                <CheckCircle size={12} /> +3gg
                              </button>
                              <button
                                onClick={() => handleExpireTrial(u.user_id)}
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                title="Fai scadere il trial ora (per test)"
                              >
                                <XCircle size={12} /> Scadi
                              </button>
                              <button
                                onClick={() => setEditingUser({ user_id: u.user_id, plan: u.plan, trial_ends_at: u.trial_ends_at?.substring(0, 10) || '' })}
                                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-md transition-colors flex items-center gap-1"
                              >
                                <Edit3 size={12} /> Modifica
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Modifica Utente</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Piano</label>
                <select
                  value={editingUser.plan}
                  onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Scadenza Trial</label>
                <input
                  type="date"
                  value={editingUser.trial_ends_at}
                  onChange={(e) => setEditingUser({ ...editingUser, trial_ends_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {saveMessage && (
                <div className={`p-3 rounded-lg text-sm font-medium ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {saveMessage.text}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">Annulla</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                <Save size={16} /> {isSaving ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
