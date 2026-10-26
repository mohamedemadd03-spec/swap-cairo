import React, { useState, useEffect } from 'react';
import { Garment, WardrobeItem } from '../../types/swap';

interface BioscienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Garment | WardrobeItem;
}

export const BioscienceModal: React.FC<BioscienceModalProps> = ({ isOpen, onClose, item }) => {
  const [loading, setLoading] = useState(false);
  const [bioData, setBioData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !item) return;
    fetchBioscienceData();
  }, [isOpen, item]);

  const fetchBioscienceData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fiber-bioscience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentTitle: item.title,
          primaryMaterial: item.title.includes('Denim') ? 'denim' : item.title.includes('Flannel') ? 'wool' : 'cotton',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBioData(data);
      }
    } catch {
      // Quiet fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#131317] border-2 border-[#e0b6ff] p-5 flex flex-col gap-4 font-mono-zine shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#2A2A33] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#e0b6ff]">science</span>
            <span className="font-display-zine font-extrabold text-lg uppercase text-white">
              TEXTILE BIOSCIENCE LAB
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bioscience"
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white border border-neutral-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Item Banner */}
        <div className="p-3 bg-[#08080A] border border-neutral-800 flex items-center justify-between">
          <div className="flex flex-col truncate pr-2">
            <span className="text-[9px] uppercase text-[#e0b6ff] font-bold">ANALYZING SPECIMEN</span>
            <span className="font-bold text-white text-xs truncate">{item.title}</span>
          </div>
          <span className="px-2.5 py-1 bg-[#6d11ad] text-[#f2daff] text-[10px] font-bold uppercase rounded">
            DEEPMIND SCIENCE
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center flex flex-col items-center gap-2 text-xs text-[#e0b6ff]">
            <span className="material-symbols-outlined text-3xl animate-spin">biotech</span>
            <span>Querying PubChem database and molecular polymer pathways...</span>
          </div>
        ) : bioData ? (
          <div className="flex flex-col gap-3">
            {/* Molecular Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#08080A] border border-neutral-800 flex flex-col">
                <span className="text-[10px] text-neutral-400 uppercase">CHEMICAL FORMULA</span>
                <span className="text-sm font-bold text-[#D4FF00] mt-0.5">
                  {bioData.chemicalFormula}
                </span>
                <span className="text-[9px] text-neutral-500 mt-1">PubChem CID: {bioData.pubchemCid}</span>
              </div>

              <div className="p-3 bg-[#08080A] border border-neutral-800 flex flex-col">
                <span className="text-[10px] text-neutral-400 uppercase">CIRCULAR GRADE</span>
                <span className="text-sm font-bold text-[#e0b6ff] mt-0.5">
                  {bioData.circularScore}
                </span>
                <span className="text-[9px] text-neutral-500 mt-1">Lifecycle Index</span>
              </div>
            </div>

            {/* Polymer Structure & SMILES */}
            <div className="p-3 bg-[#08080A] border border-[#2A2A33] flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">
                // POLYMER STRUCTURE
              </span>
              <span className="text-white font-bold">{bioData.polymerName}</span>
              <div className="p-2 bg-black border border-neutral-800 text-[10px] text-neutral-400 break-all font-mono">
                SMILES: <span className="text-[#D4FF00]">{bioData.smiles}</span>
              </div>
            </div>

            {/* Environmental Footprint */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#08080A] border border-neutral-800 flex flex-col">
                <span className="text-[10px] text-neutral-400 uppercase">BIODEGRADATION</span>
                <span className="text-xs font-bold text-white mt-1">
                  ~ {bioData.biodegradationTimeline}
                </span>
              </div>
              <div className="p-2.5 bg-[#08080A] border border-neutral-800 flex flex-col">
                <span className="text-[10px] text-neutral-400 uppercase">MICROPLASTIC SHEDDING</span>
                <span className="text-xs font-bold text-[#D4FF00] mt-1">
                  {bioData.microplasticRisk}
                </span>
              </div>
            </div>

            {/* External Citation */}
            <div className="flex justify-between items-center text-[10px] text-neutral-400 border-t border-[#2A2A33] pt-2">
              <span>{bioData.provenance}</span>
              <a
                href={bioData.pubchemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e0b6ff] hover:underline flex items-center gap-0.5"
              >
                <span>PubChem Compound</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs uppercase cursor-pointer"
        >
          CLOSE LAB
        </button>
      </div>
    </div>
  );
};
