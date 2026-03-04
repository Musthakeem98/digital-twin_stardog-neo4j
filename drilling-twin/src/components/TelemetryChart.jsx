import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TelemetryChart = ({ history }) => (
  <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
    <h3 className="text-sm font-bold text-slate-500 uppercase mb-6">Real-time Data Stream</h3>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
          <Line type="monotone" dataKey="TempSensor_01" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="VibSensor_01" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default TelemetryChart;