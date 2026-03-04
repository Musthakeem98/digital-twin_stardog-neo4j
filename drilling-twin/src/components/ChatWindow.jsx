import React, { useState } from 'react';
import { Bot, X, Send, ListTree, Zap, ShieldCheck } from 'lucide-react';

const ChatWindow = ({ selectedMachine, API_BASE, onClose }) => {
  // Messages start empty until an option is clicked
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // The 3 default message options with their specific routes
  const CHAT_OPTIONS = [
    { 
      id: 'sensors', 
      text: `What are the sensors connected with machine ${selectedMachine}?`, 
      path: `/neo4j/machine/${selectedMachine}/sensors`,
      icon: <ListTree size={14} className="text-blue-400" />
    },
    { 
      id: 'reco', 
      text: "What is the recommendation for low the vibration?", 
      path: `/machine/${selectedMachine}/devices`,
      icon: <Zap size={14} className="text-yellow-400" />
    },
    { 
      id: 'safe', 
      text: `Is machine ${selectedMachine} safe??`, 
      path: `/machine/${selectedMachine}/health`,
      icon: <ShieldCheck size={14} className="text-green-400" />
    }
  ];

  const handleOptionClick = async (option) => {
    if (isTyping) return;

    // 1. Add User's selection to chat history
    const userMsg = { role: 'user', text: option.text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 2. Fetch from the specific route
      const res = await fetch(`${API_BASE}${option.path}`);
      const data = await res.json();
      console.log("API Response for", option.id, data);

      let botText = "";
      if (option.id === 'sensors') {
        const uniqueSensorIds = [...new Set(data.sensors?.map(s => s.sensor_id))];

        if (uniqueSensorIds.length > 0) {
            const formattedList = uniqueSensorIds
            .map((id, index) => `${index + 1}. ${id}`)
            .join("\n");

            botText = `The connected sensors for ${selectedMachine} are:\n${formattedList}`;
        } else {
            botText = `No sensors detected for ${selectedMachine}.`;
        }
        } else if (option.id === 'reco') {

    const uniqueSensors = data.sensors
        .reduce((acc, current) => {
        const existing = acc.find(item => item.sensor_id === current.sensor_id);

        if (!existing || (current.type !== 'Thing' && current.type !== 'Sensor')) {
            return acc
            .filter(i => i.sensor_id !== current.sensor_id)
            .concat([current]);
        }

        return acc;
        }, [])
        .filter(sensor => sensor.sensor_id === "VibSensor_01");

    botText = "";

    if (uniqueSensors.length > 0) {

        const instructionRaw = uniqueSensors[0]?.instruction;

        const cleanInstruction = String(instructionRaw || "")
        .trim()
        .toLowerCase();

        if (cleanInstruction === "it's normal. no action needed") {
        botText = `✅ Machine is operating normally. ${cleanInstruction}.`;
        }
        else if (cleanInstruction.includes("reduce") && cleanInstruction.includes("400")) {
        botText = `⚠️ Alert: Vibration is high. ${cleanInstruction}. Please take action to reduce vibration levels.`;
        }
    }
    }
    else if (option.id === 'safe') {
        botText = data.alerts.length > 0
          ? "🚨 Machine is currently UNSAFE. Reasoning engine detected parameters exceeding safety thresholds.\nAlert details:\n- " + data.alerts.join("\n- ")
          : "✅ Machine status is SAFE. All logic rules are satisfied.";
      }

      // 4. Add AI response to chat
      setMessages(prev => [...prev, { role: 'ai', text: botText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Network error: Unable to reach the Digital Twin backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col h-[600px] overflow-hidden animate-in fade-in zoom-in duration-200">
      
      {/* HEADER */}
      <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Bot size={20}/></div>
          <div>
            <h2 className="font-bold text-slate-200 text-sm">System Analysis AI</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Connected</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* QUICK QUERY OPTIONS (Show these first) */}
      <div className="p-4 bg-slate-900/30 border-b border-slate-700">
        <p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-1 tracking-wider">Select a Diagnostic Query</p>
        <div className="flex flex-col gap-2">
          {CHAT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt)}
              disabled={isTyping}
              className="group flex items-center gap-3 text-left text-xs bg-slate-700/30 hover:bg-blue-600/10 border border-slate-700 hover:border-blue-500/50 p-3 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <span className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                {opt.icon}
              </span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGE HISTORY */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-800/20 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <Bot size={48} className="mb-2" />
            <p className="text-sm italic">Waiting for query selection...</p>
          </div>
        )}
        
        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-700 text-slate-200 rounded-tl-none border border-slate-600'
                } whitespace-pre-line`}> {/* <-- ADD THIS CLASS */}
                {m.text}
                </div>
            </div>
            ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest animate-pulse ml-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
            Querying Knowledge Graph...
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-center">
        <p className="text-[10px] text-slate-500">Secure link to Stardog Knowledge Graph active.</p>
      </div>
    </div>
  );
};

export default ChatWindow;