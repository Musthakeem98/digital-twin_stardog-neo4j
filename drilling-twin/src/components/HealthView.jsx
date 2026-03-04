import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const HealthView = ({ health }) => {
  if (!health) return null;
const isDanger = health.status.toLowerCase().includes('🚨');

  return (
    <div className={`p-10 rounded-[40px] border-4 transition-all duration-700 ${isDanger ? 'bg-red-950/20 border-red-600 shadow-2xl shadow-red-900/20' : 'bg-green-950/10 border-green-600'}`}>
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className={`h-24 w-24 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-600 text-white animate-bounce' : 'bg-green-600 text-white'}`}>
          {isDanger ? <AlertTriangle size={48} /> : <CheckCircle size={48} />}
        </div>
        <div>
          <h2 className="text-5xl font-black mb-2 tracking-tighter text-white">{health.status}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Reasoning Engine Output</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active System Alarms</h3>
        {health.alerts.length > 0 ? (
          health.alerts.map((msg, i) => (
            <div key={i} className="flex items-center gap-4 bg-red-600/10 border border-red-600/20 p-5 rounded-2xl text-red-200 font-medium">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              {msg}
            </div>
          ))
        ) : (
          <div className="flex items-center gap-4 bg-green-600/10 border border-green-600/20 p-5 rounded-2xl text-green-200 font-medium">
            <CheckCircle size={18} className="text-green-500" /> All safety constraints satisfied.
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthView;