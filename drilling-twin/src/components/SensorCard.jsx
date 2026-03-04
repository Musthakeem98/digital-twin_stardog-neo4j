import React from 'react';
import { Thermometer, Zap } from 'lucide-react';

const SensorCard = ({ sensor }) => {
  const isNormal = sensor.state.toLowerCase() === 'normal';
  
  return (
    <div className={`p-6 rounded-3xl border transition-all ${!isNormal ? 'bg-red-900/10 border-red-500/50 shadow-lg' : 'bg-slate-800/80 border-slate-700'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className={`p-3 rounded-2xl ${sensor.type.includes('Temp') ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {sensor.type.includes('Temp') ? <Thermometer /> : <Zap />}
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${isNormal ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
          {sensor.state}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase mb-1">{sensor.sensor_id}</p>
      <div className="text-4xl font-mono font-bold tracking-tight text-white">
        {parseFloat(sensor.reading).toFixed(2)}
        <span className="text-lg text-slate-600 ml-1">{sensor.type.includes('Temp') ? '°C' : 'Hz'}</span>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-700/50 text-right">
        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Instruction</p>
        <p className={`text-sm font-medium italic ${!isNormal ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{sensor.instruction}</p>
      </div>
    </div>
  );
};

export default SensorCard;