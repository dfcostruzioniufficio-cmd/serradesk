import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Euro, 
  BarChart3, 
  CalendarDays,
  Target
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

import { useUser } from '../contexts/UserContext';
import { STATO_COLORS } from './OrdiniPage';

const STATI_POSITIVI = ['Confermato', 'In Produzione', 'Consegnato'];

export default function DashboardPage() {
  const { session } = useUser();
  const [ordini, setOrdini] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const user = session?.user;
    if (!user) return;

    // Fetch all orders
    const { data, error } = await supabase
      .from('ordini')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrdini(data);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Caricamento Dashboard...</div>;
  }

  // ---- METRICS CALCULATION ----
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isCurrentMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const isPrevMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
  };

  // Preventivi emessi questo mese
  const preventiviMese = ordini.filter(o => isCurrentMonth(o.created_at));
  const preventiviPrevMese = ordini.filter(o => isPrevMonth(o.created_at));

  // Percentuale di variazione tra due valori. Se il mese precedente era
  // zero, "+100%" non ha senso se anche il mese attuale è zero: in quel
  // caso non c'è nessuna variazione da mostrare.
  const deltaPercent = (attuale, precedente) => {
    if (precedente === 0) return attuale === 0 ? 0 : 100;
    return Math.round(((attuale - precedente) / precedente) * 100);
  };

  const numPrevMese = preventiviMese.length;
  const numPrevPrevMese = preventiviPrevMese.length;
  const deltaPrev = deltaPercent(numPrevMese, numPrevPrevMese);

  // Fatturato (solo confermati)
  const fatturatoTotale = ordini.filter(o => STATI_POSITIVI.includes(o.stato)).reduce((acc, o) => acc + (o.totale || 0), 0);

  const fatturatoMese = preventiviMese.filter(o => STATI_POSITIVI.includes(o.stato)).reduce((acc, o) => acc + (o.totale || 0), 0);
  const fatturatoPrevMese = preventiviPrevMese.filter(o => STATI_POSITIVI.includes(o.stato)).reduce((acc, o) => acc + (o.totale || 0), 0);
  const deltaFatturato = deltaPercent(fatturatoMese, fatturatoPrevMese);

  // Tasso di conversione Globale
  const preventiviConvertiti = ordini.filter(o => STATI_POSITIVI.includes(o.stato)).length;
  const tassoConversione = ordini.length === 0 ? 0 : Math.round((preventiviConvertiti / ordini.length) * 100);

  // ---- CHART DATA GENERATION ----
  // Raggruppa per mese: numero di preventivi emessi (conteggio) e
  // fatturato confermato (euro) sono due grandezze diverse, quindi
  // restano due serie distinte invece di essere sommate sullo stesso
  // asse come "Preventivi" (che in precedenza era in realtà un totale
  // in euro, nonostante il nome).
  const monthlyData = {};
  ordini.forEach(o => {
    const d = new Date(o.created_at);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: d.toLocaleString('it-IT', { month: 'short', year: '2-digit' }),
        Preventivi: 0,
        Fatturato: 0
      };
    }

    monthlyData[monthKey].Preventivi += 1;
    if (STATI_POSITIVI.includes(o.stato)) {
      monthlyData[monthKey].Fatturato += (o.totale || 0);
    }
  });

  const areaChartData = Object.keys(monthlyData).sort().map(k => monthlyData[k]).slice(-6); // Ultimi 6 mesi

  // Dati Torta (Stato preventivi) - stessi colori usati in Archivio Ordini,
  // così lo stesso stato ha sempre lo stesso colore in tutta l'app invece
  // di dipendere dall'ordine casuale con cui compaiono i dati.
  const statusCounts = {};
  ordini.forEach(o => {
    const s = o.stato || 'Bozza';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const pieData = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));
  const colorFor = (stato) => (STATO_COLORS[stato] || STATO_COLORS['Bozza']).text;

  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a365d] flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={28} /> Dashboard Aziendale
          </h1>
          <p className="text-sm text-gray-500 mt-1">Panoramica finanziaria e performance dei preventivi</p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Fatturato Mese</p>
                <h3 className="text-3xl font-bold text-gray-900">€ {fatturatoMese.toLocaleString('it-IT', { minimumFractionDigits: 0 })}</h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Euro className="text-blue-600" size={24} />
              </div>
            </div>
            <div className={`mt-4 text-sm font-medium flex items-center gap-1 ${deltaFatturato >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {deltaFatturato >= 0 ? <TrendingUp size={16} /> : <TrendingUp size={16} className="rotate-180" />}
              {Math.abs(deltaFatturato)}% vs Mese Precedente
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Preventivi Mese</p>
                <h3 className="text-3xl font-bold text-gray-900">{numPrevMese}</h3>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <FileText className="text-orange-600" size={24} />
              </div>
            </div>
            <div className={`mt-4 text-sm font-medium flex items-center gap-1 ${deltaPrev >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {deltaPrev >= 0 ? <TrendingUp size={16} /> : <TrendingUp size={16} className="rotate-180" />}
              {Math.abs(deltaPrev)}% vs Mese Precedente
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Fatturato Totale</p>
                <h3 className="text-3xl font-bold text-gray-900">€ {fatturatoTotale.toLocaleString('it-IT', { minimumFractionDigits: 0 })}</h3>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-gray-500 flex items-center gap-1">
              <CalendarDays size={16} /> Dall'inizio
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Conversione</p>
                <h3 className="text-3xl font-bold text-gray-900">{tassoConversione}%</h3>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Target className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-gray-500">
              Media globale (accettati su emessi)
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Preventivi emessi e fatturato confermato</h3>
            <p className="text-xs text-gray-400 mb-5">Ultimi 6 mesi con dati</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="count" axisLine={false} tickLine={false} allowDecimals={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis yAxisId="euro" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `€${value/1000}k`} />
                  <Tooltip
                    formatter={(value, name) => name === 'Fatturato' ? `€ ${value.toLocaleString('it-IT')}` : `${value} preventiv${value === 1 ? 'o' : 'i'}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => value === 'Preventivi' ? 'Preventivi emessi' : 'Fatturato confermato'} />
                  <Bar yAxisId="count" dataKey="Preventivi" fill="#bfdbfe" radius={[4, 4, 0, 0]} barSize={28} />
                  <Line yAxisId="euro" type="monotone" dataKey="Fatturato" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Stato Preventivi</h3>
            <div className="h-64 flex flex-col justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colorFor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400">Nessun dato disponibile</div>
              )}
              
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorFor(entry.name) }}></span>
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
