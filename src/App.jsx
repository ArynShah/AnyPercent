import { useState, useEffect } from 'react';
import { auth } from './firebase'; // Make sure this path is correct based on where your firebase.js is
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';


const ZONES = [
  {
    id: 'personal_care', title: 'Personal Care', icon: '🪥',
    groups: [
      {
        id: 'grooming', title: 'Grooming & Hygiene',
        tasks: [
          { id: 'brushing', title: 'Speed Brushing', splits: ['Paste Prep', 'Brushing', 'Rinse/Spit'] },
          { id: 'shower', title: 'Any% Shower', splits: ['Water On', 'Lather', 'Rinse', 'Dry Off'] },
          { id: 'nails_hands', title: 'Nail Clipping (Hands)', splits: ['Left Hand', 'Right Hand', 'Cleanup'] }
        ]
      },
      {
        id: 'apparel', title: 'Apparel & Dressing',
        tasks: [
          { id: 'dressing', title: 'Getting Changed', splits: ['Undergarments', 'Shirt/Pants', 'Accessories'] },
          { id: 'shoes_1', title: 'Tie Shoe Laces (1 Shoe)', splits: ['Cross', 'Loop', 'Pull Tight'] },
          { id: 'shoes_2', title: 'Tie Shoe Laces (2 Shoes)', splits: ['Left Shoe', 'Right Shoe'] }
        ]
      }
    ]
  },
  {
    id: 'kitchen', title: 'The Kitchen', icon: '🍳',
    groups: [
      {
        id: 'prep_cook', title: 'Prep & Cooking',
        tasks: [
          { id: 'apple', title: 'Peeling (Apple)', splits: ['Setup', 'Peeling', 'Dispose Core'] },
          { id: 'orange', title: 'Peeling (Orange)', splits: ['Puncture', 'Peel Removal', 'Separation'] },
          { id: 'eggs', title: 'Fry 2 Eggs', splits: ['Pan Heat', 'Crack Eggs', 'Plate'] }
        ]
      },
      {
        id: 'eating', title: 'Eating Speedruns',
        tasks: [
          { id: 'cereal', title: 'Bowl of Cereal', splits: ['Pour', 'Eat', 'Drink Milk'] },
          { id: 'hotdog', title: '1 Hot Dog (Glitchless)', splits: ['First Bite', 'Halfway', 'Swallow'] }
        ]
      },
      {
        id: 'cleaning', title: 'Kitchen Cleaning',
        tasks: [
          { id: 'dishwasher_load', title: 'Load Dishwasher', splits: ['Scrape Plates', 'Load Bottom', 'Load Top'] },
          { id: 'handwash_10', title: 'Handwash 10 Items', splits: ['Soap Sponge', 'Scrubbing', 'Rinse & Dry'] }
        ]
      }
    ]
  },
  {
    id: 'household', title: 'Household Chores', icon: '🧺',
    groups: [
      {
        id: 'laundry', title: 'Laundry',
        tasks: [
          { id: 'fold_10', title: 'Fold 10 Clothes', splits: ['Setup/Sort', 'Folding', 'Put Away'] },
          { id: 'fold_20', title: 'Fold 20 Clothes', splits: ['Setup/Sort', 'Folding', 'Put Away'] }
        ]
      },
      {
        id: 'vacuum', title: 'Vacuuming',
        tasks: [
          { id: 'vac_100', title: 'Vacuum 100 sqft', splits: ['Clear Floor', 'Vacuuming', 'Cord Wrap'] },
          { id: 'vac_500', title: 'Vacuum 500 sqft', splits: ['Clear Floor', 'Vacuuming', 'Cord Wrap'] }
        ]
      }
    ]
  },
  {
    id: 'outdoors', title: 'The Great Outdoors', icon: '🌱',
    groups: [
      {
        id: 'lawn', title: 'Lawn Care',
        tasks: [
          { id: 'mow_front', title: 'Mow Front Lawn', splits: ['Start Mower', 'Mowing', 'Put Away'] },
          { id: 'mow_back', title: 'Mow Back Lawn', splits: ['Start Mower', 'Mowing', 'Put Away'] }
        ]
      }
    ]
  }
];

const MOCK_LEADERBOARD = [
  { id: 1, rank: 1, name: "SpeedFolder99", time: "0:14.32", date: "2d ago", hasVideo: true },
  { id: 2, rank: 2, name: "ChoreLord", time: "0:15.80", date: "5h ago", hasVideo: true },
  { id: 3, rank: 3, name: "CleanFreak", time: "0:18.45", date: "1w ago", hasVideo: false },
];

export default function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // --- APP STATE ---
  const [view, setView] = useState('home'); 
  const [activeZone, setActiveZone] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  
  // --- TIMER STATE ---
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSplitIndex, setCurrentSplitIndex] = useState(0);
  const [recordedSplits, setRecordedSplits] = useState([]);

  // --- AUTHENTICATION LOGIC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(error.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // --- TIMER LOGIC ---
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
      setTimeout(() => { alert(`Run finished! Ready to submit to database.`); setView('task'); }, 500);
    }
  };

  // --- LOADING SCREEN ---
  if (authLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500 font-mono">Loading Any%...</div>;
  }

  // --- AUTHENTICATION UI ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col items-center justify-center p-5 selection:bg-green-500/30">
        <div className="w-full max-w-sm">
          <h1 className="text-5xl font-black italic tracking-tighter text-center mb-2">
            Any<span className="text-green-500">%</span>
          </h1>
          <p className="text-zinc-500 text-center mb-8 font-mono text-sm uppercase tracking-widest">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </p>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
            <input 
              type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 outline-none focus:border-green-500 transition-colors"
            />
            <input 
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 outline-none focus:border-green-500 transition-colors"
            />
            <button type="submit" className="bg-green-500 text-zinc-950 font-black text-lg py-4 rounded-xl active:scale-95 transition-transform mt-2 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              {authMode === 'login' ? 'LOG IN' : 'SIGN UP'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <span className="text-zinc-600 text-sm font-semibold uppercase">Or</span>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-zinc-500 hover:text-white transition-colors text-sm font-semibold">
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-green-500/30">
      
      {/* LEVEL 1: ZONES (Home) */}
      {view === 'home' && (
        <div className="p-5">
          <header className="flex justify-between items-center mb-8 pt-2">
            <h1 className="text-3xl font-black italic tracking-tighter text-white">Any<span className="text-green-500">%</span></h1>
            <button onClick={() => signOut(auth)} className="bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-full hover:border-red-500/50 text-xs font-bold transition-colors">
              LOG OUT
            </button>
          </header>
          <h2 className="text-xl font-bold mb-4">Select Zone</h2>
          <div className="grid grid-cols-2 gap-4">
            {ZONES.map((zone) => (
              <button key={zone.id} onClick={() => { setActiveZone(zone); setView('group'); }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center aspect-square active:scale-95 transition-all hover:border-green-500/50">
                <span className="text-5xl mb-3">{zone.icon}</span>
                <span className="font-semibold text-zinc-300 text-center">{zone.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: GROUPS */}
      {view === 'group' && activeZone && (
        <div className="p-5">
          <button onClick={() => setView('home')} className="text-zinc-400 mb-6 block font-semibold hover:text-white transition">← Back to Zones</button>
          <h1 className="text-2xl font-black mb-6 flex items-center gap-3">{activeZone.icon} {activeZone.title}</h1>
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
          <header className="p-5 pb-2 border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => setView('group')} className="text-zinc-400 mb-4 block font-semibold hover:text-white transition">← Back to {activeZone.title}</button>
            <h1 className="text-xl font-black mb-4 text-zinc-400">{activeGroup.title}</h1>
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {activeGroup.tasks.map(task => (
                <button key={task.id} onClick={() => setActiveTask(task)} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTask.id === task.id ? 'bg-green-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                  {task.title}
                </button>
              ))}
            </div>
            <button onClick={() => { setElapsedMs(0); setCurrentSplitIndex(0); setRecordedSplits([]); setIsRunning(false); setView('timer'); }} className="w-full mt-4 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-lg py-3 rounded-xl active:scale-95 transition-all shadow-lg">
              ⏱️ ENTER LIVESPLIT
            </button>
          </header>
          <main className="flex-1 p-5 overflow-y-auto">
            <div className="w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/50 text-zinc-400 font-mono">
                  <tr><th className="p-3">#</th><th className="p-3">Player</th><th className="p-3 text-right">Time</th></tr>
                </thead>
                <tbody className="font-mono">
                  {MOCK_LEADERBOARD.map((run, i) => (
                    <tr key={run.id} className={`border-t border-zinc-800 ${i === 0 ? 'bg-green-500/10 text-green-400' : 'text-zinc-300'}`}>
                      <td className="p-3 font-black">{run.rank}</td>
                      <td className="p-3 font-semibold">{run.name}</td>
                      <td className="p-3 font-black text-right">{run.time}</td>
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
          <button onClick={() => setView('task')} className="text-zinc-400 mb-6 block font-semibold hover:text-white transition">← Cancel Run</button>
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-center mb-8">{activeTask.title}</h2>
            <div className="flex-1 space-y-3">
              {activeTask.splits.map((split, idx) => {
                const isCompleted = idx < currentSplitIndex || (!isRunning && recordedSplits.length > 0);
                const isActive = idx === currentSplitIndex && isRunning;
                return (
                  <div key={idx} className={`flex justify-between p-3 rounded-lg border ${isActive ? 'bg-zinc-800 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-zinc-900 border-zinc-800'} ${isCompleted ? 'opacity-50' : ''}`}>
                    <span className="font-semibold">{split}</span>
                    <span className="font-mono">{isCompleted ? formatTime(recordedSplits[idx]) : '-:--.--'}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center my-8 text-7xl font-black font-mono tracking-tighter text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              {formatTime(elapsedMs)}
            </div>
            <button onClick={handleSplit} className={`w-full py-8 rounded-2xl text-3xl font-black active:scale-95 transition-all ${!isRunning ? 'bg-green-500 text-zinc-950 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-zinc-100 text-zinc-900'}`}>
              {!isRunning && recordedSplits.length === 0 ? 'START RUN' : 'SPLIT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}