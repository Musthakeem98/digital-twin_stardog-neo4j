import React from 'react';
import { Cpu, Play, Pause } from 'lucide-react';

const API_BASE = "http://localhost:8000/api/v1";

const SimulationControl = ({ selectedMachine, isManual, setIsManual, manualValues, setManualValues }) => {
  const handleApplyManual = async () => {
    try {
      await fetch(`${API_BASE}/machine/${selectedMachine}/update-sensors?temp=${manualValues.temp}&vib=${manualValues.vib}&sound=${manualValues.sound}`, {
        method: 'POST'
      });
      setIsManual(true);
    } catch (err) {
      alert("Failed to apply manual override");
    }
  };

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all ${isManual ? 'bg-orange-900/10 border-orange-500/50' : 'bg-slate-800/40 border-slate-700'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isManual ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
            <Cpu size={20} />
          </div>
          <h3 className="font-bold uppercase tracking-tight text-white text-sm">Simulator Control</h3>
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded ${isManual ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
          {isManual ? 'MANUAL OVERRIDE' : 'AUTO SIMULATING'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Set Temp (°C)</label>
          <input 
            type="number" 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 mt-1 outline-none text-white focus:ring-2 ring-blue-500"
            value={manualValues.temp}
            onChange={(e) => setManualValues({...manualValues, temp: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Set Vib (Hz)</label>
          <input 
            type="number" 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 mt-1 outline-none text-white focus:ring-2 ring-blue-500"
            value={manualValues.vib}
            onChange={(e) => setManualValues({...manualValues, vib: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Set Sound (DB)</label>
          <input 
            type="number" 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 mt-1 outline-none text-white focus:ring-2 ring-blue-500"
            value={manualValues.sound}
            onChange={(e) => setManualValues({...manualValues, sound: e.target.value})}
          />
        </div>
        <button onClick={handleApplyManual} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Pause size={16}/> Apply Manual
        </button>
        <button onClick={() => setIsManual(false)} disabled={!isManual} className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isManual ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
          <Play size={16}/> Resume Auto
        </button>
      </div>
    </div>
  );
};

export default SimulationControl;