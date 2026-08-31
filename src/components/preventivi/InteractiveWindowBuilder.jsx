import React, { useState, useRef, useEffect } from 'react';
import { Settings2, SplitSquareHorizontal, SplitSquareVertical, Trash2 } from 'lucide-react';

const FRAME = 20;

// Helper to generate IDs
const uid = () => Math.random().toString(36).substr(2, 9);

export default function InteractiveWindowBuilder({ initialWidth = 1000, initialHeight = 1500, initialTree, onSave, onClose }) {
  // Se non c'è un albero iniziale, creiamo una foglia (leaf) radice
  const [tree, setTree] = useState(initialTree || {
    id: 'root',
    type: 'leaf',
    props: { apertura: 'Fisso', vetro: '' }
  });

  const [activeNodeId, setActiveNodeId] = useState(null);
  
  // Trova un nodo per ID
  const findNode = (node, id) => {
    if (node.id === id) return node;
    if (node.children) {
      for (let c of node.children) {
        const found = findNode(c, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeNode = activeNodeId ? findNode(tree, activeNodeId) : null;

  // Sostituisce un nodo nell'albero
  const replaceNode = (node, id, newNode) => {
    if (node.id === id) return newNode;
    if (node.children) {
      return { ...node, children: node.children.map(c => replaceNode(c, id, newNode)) };
    }
    return node;
  };

  // Dividi nodo
  const handleSplit = (type) => {
    if (!activeNodeId) return;
    const node = findNode(tree, activeNodeId);
    if (!node || node.type !== 'leaf') return;

    // Se stiamo dividendo verticalmente (Aggiungi Montante), i figli saranno affiancati
    const newNode = {
      id: node.id, // Manteniamo lo stesso ID per il contenitore
      type: type, // 'v-split' (montante) o 'h-split' (traverso)
      ratios: [0.5, 0.5], // Diviso a metà
      children: [
        { id: uid(), type: 'leaf', props: { ...node.props } },
        { id: uid(), type: 'leaf', props: { ...node.props } }
      ]
    };

    setTree(replaceNode(tree, activeNodeId, newNode));
    setActiveNodeId(newNode.children[0].id); // Seleziona il primo figlio
  };

  // Aggiorna proprietà foglia
  const updateProps = (key, value) => {
    if (!activeNodeId) return;
    const node = findNode(tree, activeNodeId);
    if (!node || node.type !== 'leaf') return;

    const newNode = { ...node, props: { ...node.props, [key]: value } };
    setTree(replaceNode(tree, activeNodeId, newNode));
  };

  // Funzione ricorsiva di rendering
  const renderNode = (node, x, y, w, h) => {
    if (node.type === 'leaf') {
      const isSelected = activeNodeId === node.id;
      return (
        <g key={node.id} onClick={(e) => { e.stopPropagation(); setActiveNodeId(node.id); }} className="cursor-pointer">
          <rect 
            x={x+FRAME/2} y={y+FRAME/2} width={w-FRAME} height={h-FRAME} 
            fill={isSelected ? "#e0f2fe" : "#f0f9ff"} 
            stroke={isSelected ? "#0284c7" : "#bae6fd"} 
            strokeWidth={isSelected ? 4 : 2}
            className="transition-colors"
          />
          {/* Vetro inner stroke */}
          <rect x={x+FRAME/2+8} y={y+FRAME/2+8} width={w-FRAME-16} height={h-FRAME-16} fill="none" stroke="#e0f2fe" strokeWidth="2" />
          
          <text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle" fill="#0369a1" fontSize="14" fontWeight="bold">
            {node.props.apertura}
          </text>
          <text x={x+w/2} y={y+h/2 + 20} textAnchor="middle" dominantBaseline="middle" fill="#0284c7" fontSize="12">
            {Math.round(w)} x {Math.round(h)} mm
          </text>
        </g>
      );
    }

    if (node.type === 'v-split') {
      const w1 = w * node.ratios[0];
      const w2 = w * node.ratios[1];
      return (
        <g key={node.id}>
          {renderNode(node.children[0], x, y, w1, h)}
          {renderNode(node.children[1], x + w1, y, w2, h)}
          {/* Montante */}
          <rect x={x + w1 - FRAME/2} y={y} width={FRAME} height={h} fill="#94a3b8" />
        </g>
      );
    }

    if (node.type === 'h-split') {
      const h1 = h * node.ratios[0];
      const h2 = h * node.ratios[1];
      return (
        <g key={node.id}>
          {renderNode(node.children[0], x, y, w, h1)}
          {renderNode(node.children[1], x, y + h1, w, h2)}
          {/* Traverso */}
          <rect x={x} y={y + h1 - FRAME/2} width={w} height={FRAME} fill="#94a3b8" />
        </g>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-10">
      <div className="bg-white w-full max-w-7xl h-full rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200">
        
        {/* Canvas Area (Left) */}
        <div className="flex-1 bg-gray-100 flex flex-col relative" onClick={() => setActiveNodeId(null)}>
           <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <Settings2 className="text-blue-600" />
                 Costruttore Infisso Avanzato
              </h2>
              <div className="flex gap-4 text-sm font-semibold text-gray-500">
                 <span>L: {initialWidth} mm</span>
                 <span>H: {initialHeight} mm</span>
              </div>
           </div>

           <div className="flex-1 overflow-auto flex items-center justify-center p-8">
             <div className="bg-white shadow-xl relative" style={{ width: '100%', maxWidth: '600px', aspectRatio: `${initialWidth}/${initialHeight}` }}>
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox={`0 0 ${initialWidth} ${initialHeight}`} 
                  preserveAspectRatio="none"
                >
                   {/* Telaio Esterno */}
                   <rect x={0} y={0} width={initialWidth} height={initialHeight} fill="#94a3b8" />
                   {/* Albero */}
                   {renderNode(tree, 0, 0, initialWidth, initialHeight)}
                </svg>
             </div>
           </div>
        </div>

        {/* Toolbar (Right) */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col z-20 shadow-lg">
          <div className="p-6 flex-1 overflow-y-auto">
            {activeNode && activeNode.type === 'leaf' ? (
              <div className="space-y-6">
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 mb-1">Modifica Sezione</h3>
                   <p className="text-sm text-gray-500 mb-4">Aggiungi montanti, traversi o configura l'apertura.</p>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => handleSplit('v-split')} className="flex flex-col items-center justify-center gap-2 bg-blue-50 text-blue-700 p-4 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 font-semibold text-sm">
                     <SplitSquareVertical size={24} />
                     Aggiungi Montante
                   </button>
                   <button onClick={() => handleSplit('h-split')} className="flex flex-col items-center justify-center gap-2 bg-blue-50 text-blue-700 p-4 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 font-semibold text-sm">
                     <SplitSquareHorizontal size={24} />
                     Aggiungi Traverso
                   </button>
                 </div>

                 <div className="border-t border-gray-100 pt-6 space-y-4">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Apertura</label>
                     <select 
                       value={activeNode.props.apertura} 
                       onChange={e => updateProps('apertura', e.target.value)}
                       className="w-full h-11 px-4 border border-gray-300 rounded-xl bg-gray-50 font-medium"
                     >
                        <option value="Fisso">Fisso</option>
                        <option value="Battente">Battente</option>
                        <option value="Ribalta">Anta a Ribalta</option>
                        <option value="Scorrevole">Scorrevole</option>
                     </select>
                   </div>
                   
                   {activeNode.props.apertura !== 'Fisso' && (
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1">Posizione Maniglia</label>
                       <select 
                         value={activeNode.props.maniglia || 'Centrale'} 
                         onChange={e => updateProps('maniglia', e.target.value)}
                         className="w-full h-11 px-4 border border-gray-300 rounded-xl bg-gray-50 font-medium"
                       >
                          <option value="Centrale">Centrale</option>
                          <option value="Decentrata Giù">Decentrata Giù</option>
                       </select>
                     </div>
                   )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                 <Settings2 size={48} className="opacity-20" />
                 <p className="text-lg font-medium">Seleziona un vetro o un'anta sul disegno per configurarla.</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
             <button onClick={onClose} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
               Annulla
             </button>
             <button onClick={() => onSave(tree)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
               Salva Disegno
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
