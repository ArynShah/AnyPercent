import { useState, useEffect } from 'react';

// --- NEW 3-TIER DATA STRUCTURE ---
const ZONES = [
  {
    id: 'grooming', title: 'Grooming', icon: '🪥',
    groups: [
      {
        id: 'morning_routine', title: 'Morning Routine',
        tasks: [
          { id: 'brushing', title: 'Speed Brushing', splits: ['Paste Prep', 'Brushing', 'Rinse'] },
          { id: 'shower', title: 'Any% Shower', splits: ['Water On', 'Lather', 'Dry Off'] },
          { id: 'dressing', title: 'Getting Dressed', splits: ['Undergarments', 'Shirt/Pants', 'Shoes'] }
        ]
      }
    ]
  },
  {
    id: 'kitchen', title: 'Kitchen', icon: '🍳',
    groups: [
      {
        id: 'cleaning', title: 'Kitchen Cleaning',
        tasks: [
          { id: 'dishes', title: 'Load Dishwasher', splits: ['Scrape Plates', 'Load Bottom', 'Load Top'] },
          { id: 'counters', title: 'Wipe Counters', splits: ['Clear Items', 'Spray', 'Wipe'] }
        ]
      },
      {
        id: 'prep', title: 'Food Prep',
        tasks: [
          { id: 'apple', title: 'Peeling an Apple', splits: ['Setup', 'Peeling', 'Cleanup'] }
        ]
      }
    ]
  }
];

const MOCK_LEADERBOARD = [
  { id: 1, rank: 1, name: "SpeedFolder99", time: "0:14.32", date: "2d ago", hasVideo: true },
  { id: 2, rank: 2, name: "Aryan", time: "0:15.80", date: "5h ago", hasVideo: true },
  { id: 3, rank: 3, name: "CleanFreak", time: "0:18.45", date: "1w ago", hasVideo: false },
];

export default function App() {
  const [view, setView] = useState('home'); // 'home', 'group', 'task', 'timer'
  const [activeZone, setActiveZone] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  
  // Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSplitIndex, setCurrentSplitIndex] = useState(0);
  const [recordedSplits, setRecordedSplits] = useState([]);

  const formatTime = (ms) => {
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setElapsedMs(prev => prev + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSplit = () => {
    if (!isRunning) return setIsRunning(true);
    setRecordedSplits([...recordedSplits, elapsedMs]);
    if (currentSplitIndex < activeTask.splits.length - 1) {
      setCurrentSplitIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      setTimeout(() => { alert(`Run finished! Ready to submit.`); setView('task'); }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-green-500/30">
      
      {/* LEVEL 1: ZONES (Home) */}
      {view === 'home' && (
        <div className="p-5">
          <header className="flex justify-between items-center mb-8 pt-2">
            <h1 className="text-3xl font-black italic tracking-tighter text-white">Any<span className="text-green-500">%</span></h1>
          </header>
          <h2 className="text-xl font-bold mb-4">Select Zone</h2>
          <div className="grid grid-cols-2 gap-4">
            {ZONES.map((zone) => (
              <button key={zone.id} onClick={() => { setActiveZone(zone); setView('group'); }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center aspect-square active:scale-95 transition-all hover:border-green-500/50">
                <span className="text-5xl mb-3">{zone.icon}</span>
                <span className="font-semibold text-zinc-300">{zone.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: GROUPS */}
      {view === 'group' && activeZone && (
        <div className="p-5">
          <button onClick={() => setView('home')} className="text-zinc-400 mb-6 block">← Back to Zones</button>
          <h1 className="text-2xl font-black mb-6">{activeZone.icon} {activeZone.title}</h1>
          <div className="space-y-3">
            {activeZone.groups.map(group => (
              <button key={group.id} onClick={() => { setActiveGroup(group); setView('task'); setActiveTask(group.tasks[0]); }} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-left font-bold text-lg active:scale-95 transition-all hover:border-green-500/50 flex justify-between items-center">
                {group.title}
                <span className="text-zinc-600">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 3: TASKS & LEADERBOARD */}
      {view === 'task' && activeGroup && activeTask && (
        <div className="flex flex-col h-screen">
          <header className="p-5 pb-2 border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10">
            <button onClick={() => setView('group')} className="text-zinc-400 mb-4 block">← Back to {activeZone.title}</button>
            <h1 className="text-xl font-black mb-4 text-zinc-400">{activeGroup.title}</h1>
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {activeGroup.tasks.map(task => (
                <button key={task.id} onClick={() => setActiveTask(task)} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTask.id === task.id ? 'bg-green-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                  {task.title}
                </button>
              ))}
            </div>
            <button onClick={() => { setElapsedMs(0); setCurrentSplitIndex(0); setRecordedSplits([]); setIsRunning(false); setView('timer'); }} className="w-full mt-4 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-lg py-3 rounded-xl active:scale-95 transition-all">
              ⏱️ ENTER LIVESPLIT
            </button>
          </header>
          <main className="flex-1 p-5 overflow-y-auto">
            <div className="w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/50 text-zinc-400 font-mono">
                  <tr><th className="p-3">#</th><th className="p-3">Player</th><th className="p-3">Time</th></tr>
                </thead>
                <tbody className="font-mono">
                  {MOCK_LEADERBOARD.map((run, i) => (
                    <tr key={run.id} className={`border-t border-zinc-800 ${i === 0 ? 'bg-green-500/10 text-green-400' : 'text-zinc-300'}`}>
                      <td className="p-3 font-black">{run.rank}</td>
                      <td className="p-3 font-semibold">{run.name}</td>
                      <td className="p-3 font-black">{run.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      )}

      {/* LIVESPLIT TIMER */}
      {view === 'timer' && activeTask && (
        <div className="flex flex-col h-screen p-5">
          <button onClick={() => setView('task')} className="text-zinc-400 mb-6 block">← Cancel Run</button>
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-center mb-8">{activeTask.title}</h2>
            <div className="flex-1 space-y-3">
              {activeTask.splits.map((split, idx) => {
                const isCompleted = idx < currentSplitIndex || (!isRunning && recordedSplits.length > 0);
                const isActive = idx === currentSplitIndex && isRunning;
                return (
                  <div key={idx} className={`flex justify-between p-3 rounded-lg border ${isActive ? 'bg-zinc-800 border-green-500/50 text-green-400' : 'bg-zinc-900 border-zinc-800'} ${isCompleted ? 'opacity-50' : ''}`}>
                    <span className="font-semibold">{split}</span>
                    <span className="font-mono">{isCompleted ? formatTime(recordedSplits[idx]) : '-:--.--'}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center my-8 text-7xl font-black font-mono tracking-tighter text-green-500">
              {formatTime(elapsedMs)}
            </div>
            <button onClick={handleSplit} className={`w-full py-8 rounded-2xl text-3xl font-black active:scale-95 ${!isRunning ? 'bg-green-500 text-zinc-950' : 'bg-zinc-100 text-zinc-900'}`}>
              {!isRunning && recordedSplits.length === 0 ? 'START RUN' : 'SPLIT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}