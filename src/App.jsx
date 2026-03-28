import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { 
  signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, setDoc, addDoc, collection, serverTimestamp, getDoc, 
  query, where, orderBy, limit, getDocs, updateDoc, arrayUnion 
} from 'firebase/firestore'; 

const ZONES = [
  {
    id: 'kitchen', title: 'Kitchen', icon: '🍳',
    categories: [
      {
        id: 'washing_dishes', title: 'Washing dishes',
        runs: [
          { id: 'wash_10', title: 'Wash 10 dishes by hand', splits: ['Setup/Soap', 'Washing', 'Rinse/Dry'] },
          { id: 'unload_dw', title: 'Unload the dishwasher', splits: ['Bottom Rack', 'Top Rack', 'Cutlery'] }
        ]
      },
      {
        id: 'cooking', title: 'Cooking',
        runs: [
          { id: 'scrambled_eggs', title: 'Scrambled eggs', splits: ['Crack/Whisk', 'Pan Fry', 'Plate'] },
          { id: 'fried_rice', title: 'Fried rice', splits: ['Prep Veggies', 'Fry Rice', 'Serve'] }
        ]
      },
      {
        id: 'fruits_veg', title: 'Fruits & vegetables',
        runs: [
          { id: 'peel_orange', title: 'Peeling orange', splits: ['Puncture', 'Peel', 'Separate'] },
          { id: 'slice_apple', title: 'Slicing an apple', splits: ['Wash', 'Core', 'Slice'] },
          { id: 'dice_onion', title: 'Dicing an onion', splits: ['Peel', 'Halve', 'Dice'] },
          { id: 'peel_potato', title: 'Peel a potato', splits: ['Wash', 'Peeling', 'Cleanup'] }
        ]
      }
    ]
  },
  {
    id: 'food', title: 'Food', icon: '🍕',
    categories: [
      {
        id: 'eat_banana', title: 'Peel + eat banana',
        runs: [{ id: 'eat_banana', title: 'Peel + eat banana', splits: ['Peel', 'Eat', 'Swallow'] }]
      },
      {
        id: 'hot_dog', title: 'Hot dog',
        runs: [
          { id: 'hd_1', title: '1 hot dog', splits: ['Halfway', 'Finish'] },
          { id: 'hd_3', title: '3 hot dogs', splits: ['Dog 1', 'Dog 2', 'Dog 3'] },
          { id: 'hd_5', title: '5 hot dogs', splits: ['Dog 1', 'Dog 3', 'Dog 5'] }
        ]
      },
      {
        id: 'water', title: 'Water',
        runs: [
          { id: 'water_12oz', title: '12 oz', splits: ['Empty'] },
          { id: 'water_1l', title: '1 liter', splits: ['Halfway', 'Empty'] }
        ]
      },
      {
        id: 'ice_cream', title: 'Ice cream',
        runs: [
          { id: 'ic_1', title: '1 scoop', splits: ['Finish'] },
          { id: 'ic_2', title: '2 scoop', splits: ['Scoop 1', 'Scoop 2'] },
          { id: 'ic_3', title: '3 scoop', splits: ['Scoop 1', 'Scoop 2', 'Scoop 3'] }
        ]
      },
      {
        id: 'donut', title: 'Donut',
        runs: [
          { id: 'donut_3', title: '3 doughnut doughnut', splits: ['Donut 1', 'Donut 2', 'Donut 3'] },
          { id: 'donut_6', title: 'Half dozen', splits: ['First 3', 'Last 3', 'Swallow'] }
        ]
      },
      {
        id: 'pizza', title: 'Pizza',
        runs: [
          { id: 'pizza_8', title: '8 inch', splits: ['Halfway', 'Finish'] },
          { id: 'pizza_10', title: '10 inch', splits: ['Halfway', 'Finish'] },
          { id: 'pizza_12', title: '12 inch', splits: ['Quarter', 'Halfway', 'Finish'] }
        ]
      }
    ]
  },
  {
    id: 'bedroom', title: 'Bedroom', icon: '🛏️',
    categories: [
      {
        id: 'routines', title: 'Routines',
        runs: [
          { id: 'morning_routine', title: 'Morning Routine', splits: ['Wake Up', 'Get Up', 'Ready'] },
          { id: 'undressed', title: 'Getting undressed', splits: ['Top', 'Bottom', 'Socks'] }
        ]
      },
      {
        id: 'making_bed', title: 'Making a bed',
        runs: [
          { id: 'bed_king', title: 'King', splits: ['Fitted', 'Top Sheet', 'Pillows'] },
          { id: 'bed_queen', title: 'Queen', splits: ['Fitted', 'Top Sheet', 'Pillows'] },
          { id: 'bed_twin', title: 'Twin', splits: ['Fitted', 'Top Sheet', 'Pillows'] },
          { id: 'bed_bunk', title: 'bunk', splits: ['Climb', 'Fitted', 'Blanket'] }
        ]
      },
      {
        id: 'getting_dressed', title: 'Getting dressed',
        runs: [
          { id: 'dress_formal', title: 'Formal wear (suit)', splits: ['Shirt/Pants', 'Tie', 'Jacket/Shoes'] },
          { id: 'dress_casual', title: 'Casual (sweat suit)', splits: ['Undergarments', 'Sweats', 'Shoes'] }
        ]
      }
    ]
  },
  {
    id: 'washroom', title: 'Washroom', icon: '🚿',
    categories: [
      {
        id: 'hygiene', title: 'Daily Hygiene',
        runs: [
          { id: 'teeth', title: 'Teeth Cleaning Routine', splits: ['Brush', 'Floss', 'Rinse'] },
          { id: 'shower', title: 'Shower', splits: ['Water On', 'Wash', 'Dry'] },
          { id: 'skincare', title: 'Skin care routine', splits: ['Wash Face', 'Toner/Serum', 'Moisturizer'] }
        ]
      },
      {
        id: 'grooming', title: 'Grooming',
        runs: [
          { id: 'shave_full', title: 'Shaving - Full beard', splits: ['Cream', 'Shave', 'Aftershave'] },
          { id: 'shave_stubble', title: 'Shaving - stubble', splits: ['Cream', 'Shave', 'Rinse'] },
          { id: 'nails_hands', title: 'Clipping nails - Hands', splits: ['Left Hand', 'Right Hand', 'Cleanup'] },
          { id: 'nails_feet', title: 'Clipping nails - Feet', splits: ['Left Foot', 'Right Foot', 'Cleanup'] },
          { id: 'nails_both', title: 'Clipping nails - both', splits: ['Hands', 'Feet', 'Cleanup'] }
        ]
      }
    ]
  },
  {
    id: 'everyday', title: 'Everyday', icon: '👟',
    categories: [
      {
        id: 'shoes', title: 'Tying shoes',
        runs: [
          { id: 'shoe_1', title: 'Single shoe', splits: ['Complete'] },
          { id: 'shoe_2', title: '2 shoes', splits: ['First Shoe', 'Second Shoe'] },
          { id: 'shoe_lace', title: 'Lacing a full shoe', splits: ['Halfway', 'Done'] }
        ]
      },
      {
        id: 'errands', title: 'Errands',
        runs: [
          { id: 'mcdonalds', title: 'Mcdonalds kiosk', splits: ['Start Order', 'Customization', 'Pay'] }
        ]
      }
    ]
  },
  {
    id: 'outdoor', title: 'Outdoor', icon: '🌱',
    categories: [
      {
        id: 'yard', title: 'Yard Work',
        runs: [
          { id: 'mow', title: 'Mowing Lawn', splits: ['Start Engine', 'Mow', 'Put Away'] },
          { id: 'snow', title: 'Shoveling snow', splits: ['Bundle Up', 'Shovel Driveway', 'Salt'] }
        ]
      }
    ]
  }
];

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ friends: [] }); // User's database profile
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // App Navigation
  const [view, setView] = useState('home'); 
  const [activeZone, setActiveZone] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  
  // Leaderboard & Friends
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('global'); // 'global' or 'friends'
  const [friendSearch, setFriendSearch] = useState('');
  const [showFriendModal, setShowFriendModal] = useState(false);
  
  // Timer
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSplitIndex, setCurrentSplitIndex] = useState(0);
  const [recordedSplits, setRecordedSplits] = useState([]);

  // --- FIRESTORE UTILS ---
  const formatTime = (ms) => {
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  // --- AUTH & USER PROFILE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          // Fetch their friends list safely
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        // FINALLY guarantees the loading screen turns off no matter what!
        setAuthLoading(false); 
      }
    });
    return () => unsubscribe();
  }, []);



  const saveUserToDatabase = async (userObj, displayName) => {
    const userRef = doc(db, 'users', userObj.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: userObj.email,
        displayName: displayName || userObj.email.split('@')[0],
        friends: []
      });
      setUserData({ friends: [] });
    }
  };

  const handleAuth = async (e, isGoogle = false) => {
    if (e) e.preventDefault();
    try {
      let result;
      if (isGoogle) {
        result = await signInWithPopup(auth, new GoogleAuthProvider());
      } else if (authMode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await saveUserToDatabase(result.user, result.user.displayName);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendSearch.trim()) return;

    try {
      // Find user by their Display Name
      const q = query(collection(db, 'users'), where('displayName', '==', friendSearch));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return alert("Player not found! Tell them to check their exact username.");
      }

      const friendId = snap.docs[0].id;
      if (friendId === user.uid) return alert("You can't add yourself!");
      if (userData.friends?.includes(friendId)) return alert("Already friends!");

      // Update Database
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayUnion(friendId)
      });
      
      // Update Local State
      setUserData(prev => ({ ...prev, friends: [...(prev.friends || []), friendId] }));
      alert("Friend added successfully!");
      setFriendSearch('');
      setShowFriendModal(false);
    } catch (err) {
      alert("Error adding friend.");
      console.error(err);
    }
  };

  // --- FETCH LEADERBOARD ---
  useEffect(() => {
    if (view === 'runList' && activeRun) {
      const fetchLeaderboard = async () => {
        try {
          const q = query(
            collection(db, 'runs'), 
            where('runId', '==', activeRun.id),
            orderBy('totalTimeMs', 'asc'),
            limit(100)
          );
          const snap = await getDocs(q);
          const runs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLeaderboard(runs);
        } catch (error) {
          console.error("Firebase Index Error:", error);
          //fallback to show a message about building index
          setLeaderboard([{ id: 'err', userName: 'Building Database Index...', totalTimeMs: 0 }]);
        }
      };
      fetchLeaderboard();
    }
  }, [view, activeRun]);

  // --- TIMER SUBMISSION ---
  useEffect(() => {
    let interval;
    if (isRunning) interval = setInterval(() => setElapsedMs(prev => prev + 10), 10);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSplit = async () => {
    if (!isRunning) return setIsRunning(true);
    
    const newSplits = [...recordedSplits, elapsedMs];
    setRecordedSplits(newSplits);
    
    if (currentSplitIndex < activeRun.splits.length - 1) {
      setCurrentSplitIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      try {
        await addDoc(collection(db, 'runs'), {
          userId: user.uid,
          userName: userData.displayName || user.email.split('@')[0],
          zoneId: activeZone.id,
          categoryId: activeCategory.id,
          runId: activeRun.id,
          totalTimeMs: elapsedMs,
          splits: newSplits,
          createdAt: serverTimestamp()
        });
        alert(`Run submitted! Time: ${formatTime(elapsedMs)}`);
        setView('runList'); // Will trigger the useEffect to refetch leaderboard
      } catch (error) {
        alert("Failed to submit run.");
      }
    }
  };

  // --- RENDER HELPERS ---
  const displayedLeaderboard = leaderboard.filter(run => {
    if (leaderboardTab === 'global') return true;
    // Friends Tab: Only show if it's my run, or someone in my friends list
    return run.userId === user.uid || userData.friends?.includes(run.userId);
  });

  if (authLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500 font-mono">Loading...</div>;

  // --- AUTH UI ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm">
          <h1 className="text-5xl font-black italic tracking-tighter text-center mb-8">Any<span className="text-green-500">%</span></h1>
          <form onSubmit={(e) => handleAuth(e, false)} className="flex flex-col gap-4 mb-6">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-zinc-900 border border-zinc-800 rounded-xl p-4" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-zinc-900 border border-zinc-800 rounded-xl p-4" />
            <button type="submit" className="bg-green-500 text-zinc-950 font-black text-lg py-4 rounded-xl active:scale-95">{authMode === 'login' ? 'LOG IN' : 'SIGN UP'}</button>
          </form>
          <button onClick={(e) => handleAuth(e, true)} className="w-full bg-zinc-100 text-zinc-950 font-bold text-lg py-4 rounded-xl active:scale-95">Continue with Google</button>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-zinc-500 hover:text-white text-sm font-semibold">
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-green-500/30">
      
      {/* ADD FRIEND MODAL */}
      {showFriendModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-5">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Add Friend</h2>
            <form onSubmit={handleAddFriend} className="flex flex-col gap-4">
              <input 
                type="text" placeholder="Enter exact Username" value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 outline-none focus:border-green-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowFriendModal(false)} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-green-500 text-zinc-950 py-3 rounded-xl font-bold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIER 1: ZONES (Home) */}
      {view === 'home' && (
        <div className="p-5">
          <header className="flex justify-between items-center mb-8 pt-2">
            <h1 className="text-3xl font-black italic tracking-tighter">Any<span className="text-green-500">%</span></h1>
            <div className="flex gap-3">
              <button onClick={() => setShowFriendModal(true)} className="bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-full hover:border-green-500 text-xs font-bold transition-colors">
                + ADD FRIEND
              </button>
              <button onClick={() => signOut(auth)} className="bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-full text-zinc-500 text-xs font-bold hover:text-red-500">
                LOG OUT
              </button>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-4">
            {ZONES.map((zone) => (
              <button key={zone.id} onClick={() => { setActiveZone(zone); setView('categoryList'); }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center aspect-square active:scale-95 hover:border-green-500">
                <span className="text-5xl mb-3">{zone.icon}</span>
                <span className="font-semibold text-zinc-300 text-center">{zone.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TIER 2: CATEGORIES */}
      {view === 'categoryList' && activeZone && (
        <div className="p-5">
          <button onClick={() => setView('home')} className="text-zinc-400 mb-6 font-semibold hover:text-white">← Back</button>
          <h1 className="text-2xl font-black mb-6 flex items-center gap-3">{activeZone.icon} {activeZone.title}</h1>
          <div className="space-y-3">
            {activeZone.categories.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat); setActiveRun(cat.runs[0]); setView('runList'); }} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-left font-bold text-lg active:scale-95 hover:border-green-500 flex justify-between">
                {cat.title} <span className="text-zinc-600">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TIER 3: RUNS & LEADERBOARD */}
      {view === 'runList' && activeCategory && activeRun && (
        <div className="flex flex-col h-screen">
          <header className="p-5 pb-2 border-b border-zinc-800 bg-zinc-950 sticky top-0">
            <button onClick={() => setView('categoryList')} className="text-zinc-400 mb-4 font-semibold hover:text-white">← Back</button>
            <h1 className="text-xl font-black mb-4 text-zinc-400">{activeCategory.title}</h1>
            
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {activeCategory.runs.map(run => (
                <button key={run.id} onClick={() => setActiveRun(run)} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold ${activeRun.id === run.id ? 'bg-green-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                  {run.title}
                </button>
              ))}
            </div>

            <button onClick={() => { setElapsedMs(0); setCurrentSplitIndex(0); setRecordedSplits([]); setIsRunning(false); setView('timer'); }} className="w-full mt-4 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-lg py-3 rounded-xl active:scale-95">
              ⏱️ ENTER LIVESPLIT
            </button>
          </header>

          <main className="flex-1 p-5 overflow-y-auto">
            {/* LEADERBOARD TOGGLE */}
            <div className="flex mb-4 bg-zinc-900 p-1 rounded-lg">
              <button onClick={() => setLeaderboardTab('global')} className={`flex-1 py-2 text-sm font-bold rounded-md ${leaderboardTab === 'global' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Global</button>
              <button onClick={() => setLeaderboardTab('friends')} className={`flex-1 py-2 text-sm font-bold rounded-md ${leaderboardTab === 'friends' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Friends</button>
            </div>

            <div className="w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden min-h-[200px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/50 text-zinc-400 font-mono">
                  <tr><th className="p-3 w-8">#</th><th className="p-3">Player</th><th className="p-3 text-right">Time</th></tr>
                </thead>
                <tbody className="font-mono">
                  {displayedLeaderboard.length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-zinc-500 italic">No runs found. Be the first!</td></tr>
                  ) : (
                    displayedLeaderboard.map((run, i) => (
                      <tr key={run.id} className={`border-t border-zinc-800 ${i === 0 ? 'bg-green-500/10 text-green-400' : 'text-zinc-300'}`}>
                        <td className="p-3 font-black">{i + 1}</td>
                        <td className="p-3 font-semibold">{run.userName} {run.userId === user.uid && '(You)'}</td>
                        <td className="p-3 font-black text-right">{run.totalTimeMs ? formatTime(run.totalTimeMs) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      )}

      {/* TIMER VIEW */}
      {view === 'timer' && activeRun && (
        <div className="flex flex-col h-screen p-5">
          <button onClick={() => setView('runList')} className="text-zinc-400 mb-6 font-semibold hover:text-white">← Cancel Run</button>
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-black text-center mb-8">{activeRun.title}</h2>
            <div className="flex-1 space-y-3">
              {activeRun.splits.map((split, idx) => {
                const isCompleted = idx < currentSplitIndex || (!isRunning && recordedSplits.length > 0);
                const isActive = idx === currentSplitIndex && isRunning;
                return (
                  <div key={idx} className={`flex justify-between p-4 rounded-xl border ${isActive ? 'bg-zinc-800 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-800'} ${isCompleted ? 'opacity-50' : ''}`}>
                    <span className="font-bold">{split}</span>
                    <span className="font-mono font-bold">{isCompleted ? formatTime(recordedSplits[idx]) : '-:--.--'}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center my-8 text-7xl font-black font-mono text-green-500">
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