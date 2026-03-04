import React, { useState, useEffect } from 'react';
import { Settings, Activity, AlertTriangle, Clock, Send, Bot, MessageSquare, X } from 'lucide-react';

// Import our new components
import SimulationControl from './components/SimulationControl';
import TelemetryChart from './components/TelemetryChart';
import SensorCard from './components/SensorCard';
import HealthView from './components/HealthView';
import ChatWindow from './components/ChatWindow'; // FIX 1: Added missing import

const API_BASE = "http://localhost:8000/api/v1";

const App = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [devices, setDevices] = useState(null);
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [lastSync, setLastSync] = useState(null);
  const [isManual, setIsManual] = useState(false);
  
  const [manualValues, setManualValues] = useState({ temp: 90, vib: 50, sound: 70 });
  
  const [showChat, setShowChat] = useState(false);
  // Messages are managed inside ChatWindow based on your previous requirement 
  // but if you keep them here, ensure they reset correctly.
  const [messages, setMessages] = useState([{ role: 'ai', text: "System Online. Ready for diagnostics." }]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/machines`).then(res => res.json()).then(data => {
      setMachines(data);
      if (data.length > 0 && !selectedMachine) setSelectedMachine(data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedMachine) return;
    
    // FIX 2: Added abort controller to prevent "Zombie" data from old machines 
    // appearing in the chart after a machine switch.
    const controller = new AbortController();

    const fetchDetails = async () => {
      try {
        const [devRes, healthRes] = await Promise.all([
          fetch(`${API_BASE}/machine/${selectedMachine}/devices`, { signal: controller.signal }),
          fetch(`${API_BASE}/machine/${selectedMachine}/health`, { signal: controller.signal })
        ]);
        const devData = await devRes.json();
        const healthData = await healthRes.json();

        const uniqueSensors = devData.sensors.reduce((acc, current) => {
          const existing = acc.find(item => item.sensor_id === current.sensor_id);
          if (!existing || (current.type !== 'Thing' && current.type !== 'Sensor')) {
            return acc.filter(i => i.sensor_id !== current.sensor_id).concat([current]);
          }
          return acc;
        }, []);

        setDevices({ ...devData, sensors: uniqueSensors });
        setHealth(healthData);
        setLastSync(new Date().toLocaleTimeString());
        
        const newEntry = {
          time: new Date().toLocaleTimeString().split(' ')[0],
          ...uniqueSensors.reduce((acc, s) => ({ ...acc, [s.sensor_id]: parseFloat(s.reading) }), {})
        };
        setHistory(prev => [...prev.slice(-19), newEntry]);
      } catch (err) { 
        if (err.name !== 'AbortError') console.error(err); 
      }
    };

    fetchDetails();
    const interval = setInterval(fetchDetails, 5000);
    return () => {
      clearInterval(interval);
      controller.abort(); // Cleanup
    };
  }, [selectedMachine]);

  useEffect(() => {
    if (isManual || !selectedMachine) return;
    const runAutoSim = async () => {
      const autoTemp = (Math.random() * (105 - 85) + 85).toFixed(2);
      const autoVib = (Math.random() * (80 - 40) + 40).toFixed(2);
      const autoSound = (Math.random() * (95 - 60) + 60).toFixed(2);
      try {
        await fetch(`${API_BASE}/machine/${selectedMachine}/update-sensors?temp=${autoTemp}&vib=${autoVib}&sound=${autoSound}`, { method: 'POST' });
      } catch (e) { console.error(e); }
    };
    const simInterval = setInterval(runAutoSim, 5000);
    return () => clearInterval(simInterval);
  }, [isManual, selectedMachine]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans relative">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl"><Settings size={24} /></div>
          <div>
            <h1 className="text-xl font-black uppercase text-white">Digital Twin Monitor</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> Last Sync: {lastSync || 'Connecting...'}</p>
          </div>
        </div>
        <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <select 
            className="bg-transparent text-sm font-bold px-4 py-1.5 outline-none cursor-pointer text-white"
            value={selectedMachine || ''}
            onChange={(e) => { 
              setSelectedMachine(e.target.value); 
              setHistory([]); // Clears chart for new machine
            }}
          >
            {machines.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="flex gap-2 mb-8">
          <button onClick={() => setActiveTab('telemetry')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'telemetry' ? 'bg-blue-600' : 'text-slate-500'}`}>
            <Activity size={18}/> Telemetry
          </button>
          <button onClick={() => setActiveTab('health')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'health' ? 'bg-red-600' : 'text-slate-500'}`}>
            <AlertTriangle size={18}/> Alerts {health?.alerts?.length > 0 && <span className="bg-white text-red-600 px-1.5 rounded text-[10px] ml-1">{health.alerts.length}</span>}
          </button>
        </div>

        {activeTab === 'telemetry' ? (
          <div className="space-y-6">
            <SimulationControl 
              selectedMachine={selectedMachine} isManual={isManual} setIsManual={setIsManual} 
              manualValues={manualValues} setManualValues={setManualValues} 
            />
            <TelemetryChart history={history} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Added optional chaining ?. to prevent crash if devices is null */}
              {devices?.sensors?.map((s, idx) => <SensorCard key={idx} sensor={s} />)}
            </div>
          </div>
        ) : (
          <HealthView health={health} />
        )}
      </main>

      <button 
        onClick={() => setShowChat(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl z-40 transition-transform active:scale-95 flex items-center gap-2"
      >
        <MessageSquare size={24} />
        <span className="font-bold pr-2">Analyze System</span>
      </button>

      {showChat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ChatWindow 
            selectedMachine={selectedMachine} 
            API_BASE={API_BASE} 
            onClose={() => setShowChat(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default App;