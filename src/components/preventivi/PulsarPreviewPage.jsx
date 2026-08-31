import React from 'react';

export default function PulsarPreviewPage({ userSettings }) {
  return (
    <div 
      className="bg-white relative shadow-sm shrink-0" 
      style={{ 
        width: '210mm', 
        height: '296mm',
        overflow: 'hidden',
        padding: '12mm', 
        boxSizing: 'border-box', 
        pageBreakAfter: 'always',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif'
      }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-6">
        <div>
          <p className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Offerta</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Finestra PVC</h2>
        </div>
        <div className="text-right">
          <div className="w-48 h-14 flex items-center justify-end">
            {userSettings?.logo_base64 ? (
              <img src={userSettings.logo_base64} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs border border-dashed border-gray-300 rounded">
                [LOGO AZIENDA]
              </div>
            )}
          </div>
          <p className="text-[8px] text-gray-500 mt-1 uppercase font-semibold">Producent Stolarki PCV i Aluminium</p>
        </div>
      </div>

      <div className="text-center mb-10 px-10">
        <p className="text-[12px] text-gray-600 italic">
          Riconoscenti per l'invito ad avanzare la nostra offerta, abbiamo il piacere di presentarVi il calcolo<br/>
          tecnico - economico per il prodotto da noi realizzato
        </p>
      </div>

      <h1 className="text-[55px] font-black text-slate-800 mb-6 leading-none">Pulsar</h1>

      <p className="text-[12px] text-gray-700 leading-relaxed mb-10 text-justify">
        Il sistema è caratterizzato da un design minimalista con forme snelle ed espressive e un battente estremamente
        sottile da 9 mm. Insieme ai listelli fermavetro uniti ad angolo di 90°, conferisce alla falegnameria un aspetto molto
        moderno, che imita l'alluminio. L'altezza di montaggio del telaio e dell'anta ridotta garantisce più luce negli ambienti.
        LA speciale tecnologia di incollaggio dei vetri permette di realizzare finestre di grandi dimensioni, ma allo stesso
        tempo stabili e sicure, grazie alle quali possiamo ben illuminare l'interno, creando uno spazio luminoso e un'atmosfera
        amichevole
      </p>

      {/* TWO COLUMNS WITH BULLETS */}
      <div className="flex gap-8 mb-8 flex-1">
        {/* Profile Image (Left) */}
        <div className="w-[30%] flex flex-col items-center">
           <div className="w-full aspect-[1/2] bg-gray-50 flex flex-col items-center justify-center text-gray-400 font-bold text-xs border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
             📷<br/>FOTO SEZIONE<br/>PROFILO<br/><br/><span className="text-[9px] font-normal">Cercare foto 6 camere su Google</span>
           </div>
        </div>

        {/* Bullets (Right) */}
        <div className="w-[70%] grid grid-cols-2 gap-x-8 gap-y-6 content-start">
          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Sistema a 6 camere con profondità di installazione di 76 mm, dotato di 3 guarnizioni saldate agli angoli della finestra, che forniscono un'eccellente isolamento termico e acustico</span>
          </div>
          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Pacchetto triplo vetro 4/18CR/4/18CR/4 con eccellenti parametri di isolamento termico Ug=0,5 W/m²K e trasmissività luminosa al livello di Lt=74%, di serie con termocornice.</span>
          </div>
          
          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Altezza ridotta della combinazione di telaio e anta di 110 mm che garantisce una maggiore quantità di luce all'interno.</span>
          </div>
          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Ferramenta WINKHAUS Active Pilot che garantisce durata e comfort d'uso.</span>
          </div>

          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Tecnologia di saldatura senza sbavature V-Perfect, che permette di ottenere un effetto di perfetta, quasi invisibile unione degli angoli delle finestre.</span>
          </div>
          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Ampia gamma di 57 pellicole con diverse texture e colori (effetto legno, satinato e metallizzato) che permettono infinite possibilità nella progettazione della propria abitazione.</span>
          </div>

          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Acciaio chiuso nel telaio con spessore da 1,5 mm a 2,0 mm</span>
          </div>
          <div></div>

          <div className="text-[10px] text-gray-800 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 text-xs">●</span>
            <span className="leading-tight">Listelli fermavetro squadrati, uniti ad angolo di 90° o arrotondati, uniti ad angolo di 45°</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BANNER */}
      <div className="mt-auto">
        <div className="flex justify-center mb-[-10px] relative z-10">
          <div className="bg-white border-2 border-gray-300 text-gray-500 text-[10px] px-8 py-2 rounded-full shadow-sm font-bold uppercase tracking-wider">
            possibilità di aggiornare le finestre con purenit e nastri in fase di produzione
          </div>
        </div>
        
        <div className="w-full h-40 bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 font-bold text-lg border border-slate-700 shadow-inner relative overflow-hidden">
           <span className="uppercase text-slate-300">investimento nel risparmio</span>
           <span className="text-[10px] font-normal mt-2 text-slate-500">BANNER CASE / INSERIRE IMMAGINE DA FILE</span>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-32 h-10 flex items-center justify-end">
            {userSettings?.logo_base64 ? (
              <img src={userSettings.logo_base64} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-[9px] border border-dashed border-gray-300 rounded">
                [LOGO PICCOLO]
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
