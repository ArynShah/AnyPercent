import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { 
  signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, setDoc, addDoc, collection, serverTimestamp, getDoc, 
  query, where, orderBy, limit, getDocs, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore'; 

// --- THE FINAL 3-TIER TASK LIST ---
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
  const [userData, setUserData] = useState({ friends: [] }); 
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // App Navigation
  const [view, setView] = useState('home'); // home, categoryList, runList, timer, submission, profile, friends
  const [activeZone, setActiveZone] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  
  // Leaderboard & Friends
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('global');
  const [friendSearch, setFriendSearch] = useState('');
  const [resolvedFriends, setResolvedFriends] = useState([]); // Holds actual friend objects
  const [selectedRun, setSelectedRun] = useState(null); // For viewing split details
  
  // Timer & Submission
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSplitIndex, setCurrentSplitIndex] = useState(0);
  const [recordedSplits, setRecordedSplits] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');

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
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
            setNewUsername(userSnap.data().displayName); // Pre-fill edit profile
          }
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      } finally {
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
      setUserData({ displayName: displayName || userObj.email.split('@')[0], friends: [] });
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName: newUsername });
      setUserData(prev => ({ ...prev, displayName: newUsername }));
      alert("Profile updated!");
      setView('home');
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  // --- FRIENDS SYSTEM ---
  useEffect(() => {
    if (view === 'friends' && userData.friends?.length > 0) {
      const fetchFriends = async () => {
        const friendsData = await Promise.all(
          userData.friends.map(async (uid) => {
            const snap = await getDoc(doc(db, 'users', uid));
            return { id: uid, ...snap.data() };
          })
        );
        setResolvedFriends(friendsData);
      };
      fetchFriends();
    } else {
      setResolvedFriends([]);
    }
  }, [view, userData.friends]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendSearch.trim()) return;
    try {
      const q = query(collection(db, 'users'), where('displayName', '==', friendSearch));
      const snap = await getDocs(q);
      if (snap.empty) return alert("Player not found! Check exact spelling.");
      
      const friendId = snap.docs[0].id;
      if (friendId === user.uid) return alert("You can't add yourself!");
      if (userData.friends?.includes(friendId)) return alert("Already friends!");

      await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(friendId) });
      setUserData(prev => ({ ...prev, friends: [...(prev.friends || []), friendId] }));
      setFriendSearch('');
    } catch (err) {
      alert("Error adding friend.");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { friends: arrayRemove(friendId) });
      setUserData(prev => ({ ...prev, friends: prev.friends.filter(id => id !== friendId) }));
    } catch (err) {
      alert("Error removing friend.");
    }
  };

  // --- FETCH LEADERBOARD ---
  useEffect(() => {
    if (view === 'runList' && activeRun) {
      const fetchLeaderboard = async () => {
        try {
          const q = query(collection(db, 'runs'), where('runId', '==', activeRun.id), orderBy('totalTimeMs', 'asc'), limit(100));
          const snap = await getDocs(q);
          setLeaderboard(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Index Error:", error);
        }
      };
      fetchLeaderboard();
    }
  }, [view, activeRun]);

  // --- TIMER & SUBMISSION LOGIC ---
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
      setView('submission'); // Intercept and go to submission screen
    }
  };

  const cancelRun = () => {
    setIsRunning(false);
    setElapsedMs(0);
    setRecordedSplits([]);
    setCurrentSplitIndex(0);
    setView('runList');
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'runs'), {
        userId: user.uid,
        userName: userData.displayName || user.email.split('@')[0],
        zoneId: activeZone.id,
        categoryId: activeCategory.id,
        runId: activeRun.id,
        totalTimeMs: elapsedMs,
        splits: recordedSplits,
        videoUrl: videoUrl,
        hasVideo: videoUrl.length > 5,
        createdAt: serverTimestamp()
      });
      alert(`Run submitted successfully!`);
      setVideoUrl('');
      cancelRun(); // Resets everything and goes back to leaderboard
    } catch (error) {
      alert("Failed to submit run.");
    }
  };

  const displayedLeaderboard = leaderboard.filter(run => {
    if (leaderboardTab === 'global') return true;
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
      
      {/* RUN DETAILS MODAL (Tappable Splits) */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-3xl w-full max-w-md border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-green-500">{selectedRun.userName}'s Run</h2>
              <button onClick={() => setSelectedRun(null)} className="text-zinc-500 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="text-center mb-8">
              <div className="text-5xl font-mono font-black">{formatTime(selectedRun.totalTimeMs)}</div>
              {selectedRun.hasVideo && (
                <a href={selectedRun.videoUrl} target="_blank" rel="noreferrer" className="text-green-400 text-sm font-bold mt-2 inline-block hover:underline">
                  ▶ Watch Video Proof
                </a>
              )}
            </div>

            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Splits Breakdown</h3>
            <div className="space-y-2 mb-6">
              {activeRun.splits.map((splitName, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="font-semibold text-zinc-300">{splitName}</span>
                  <span className="font-mono text-zinc-400">{formatTime(selectedRun.splits[idx] || 0)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedRun(null)} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition">Close</button>
          </div>
        </div>
      )}

      {/* HEADER NAVIGATION (Shown on most screens) */}
      {!['timer', 'submission'].includes(view) && (
        <header className="flex justify-between items-center p-5 pt-7 border-b border-zinc-900">
          <h1 onClick={() => setView('home')} className="text-3xl font-black italic tracking-tighter cursor-pointer">Any<span className="text-green-500">%</span></h1>
          <div className="flex gap-2">
            <button onClick={() => setView('friends')} className="bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-full hover:border-green-500 text-sm font-bold transition">
              👥 Friends
            </button>
            <button onClick={() => setView('profile')} className="bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-full hover:border-green-500 text-sm font-bold transition">
              ⚙️ Profile
            </button>
          </div>
        </header>
      )}

      {/* PROFILE MANAGER */}
      {view === 'profile' && (
        <div className="p-5 max-w-sm mx-auto mt-10">
          <button onClick={() => setView('home')} className="text-zinc-400 mb-6 font-semibold hover:text-white">← Back</button>
          <h2 className="text-2xl font-black mb-6">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Display Name</label>
              <input 
                type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 outline-none focus:border-green-500 font-bold"
              />
            </div>
            <button type="submit" className="w-full bg-green-500 text-zinc-950 py-4 rounded-xl font-black text-lg active:scale-95 mt-4">Save Changes</button>
            <button type="button" onClick={() => signOut(auth)} className="w-full bg-zinc-900 text-red-500 py-4 rounded-xl font-bold border border-zinc-800 mt-4">Log Out</button>
          </form>
        </div>
      )}

      {/* FRIENDS MANAGER */}
      {view === 'friends' && (
        <div className="p-5 max-w-md mx-auto">
          <button onClick={() => setView('home')} className="text-zinc-400 mb-6 font-semibold hover:text-white">← Back</button>
          <h2 className="text-2xl font-black mb-6">Friends List</h2>
          
          <form onSubmit={handleAddFriend} className="flex gap-2 mb-8">
            <input 
              type="text" placeholder="Enter exact Username" value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none focus:border-green-500 font-semibold"
            />
            <button type="submit" className="bg-green-500 text-zinc-950 px-6 rounded-xl font-black">ADD</button>
          </form>

          <div className="space-y-3">
            {resolvedFriends.length === 0 ? (
              <p className="text-zinc-500 italic text-center py-10">No friends added yet. Speedrunning is better together!</p>
            ) : (
              resolvedFriends.map(friend => (
                <div key={friend.id} className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <span className="font-bold text-lg">{friend.displayName}</span>
                  <button onClick={() => handleRemoveFriend(friend.id)} className="text-red-500 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-md hover:bg-red-500/20">Remove</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* HOME / ZONES */}
      {view === 'home' && (
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {ZONES.map((zone) => (
              <button key={zone.id} onClick={() => { setActiveZone(zone); setView('categoryList'); }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center aspect-square active:scale-95 hover:border-green-500 transition">
                <span className="text-5xl mb-3 drop-shadow-lg">{zone.icon}</span>
                <span className="font-bold text-zinc-300 text-center">{zone.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {view === 'categoryList' && activeZone && (
        <div className="p-5">
          <button onClick={() => setView('home')} className="text-zinc-400 mb-6 font-semibold hover:text-white">← Back</button>
          <h1 className="text-2xl font-black mb-6 flex items-center gap-3">{activeZone.icon} {activeZone.title}</h1>
          <div className="space-y-3">
            {activeZone.categories.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat); setActiveRun(cat.runs[0]); setView('runList'); }} className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-left font-bold text-lg active:scale-95 hover:border-green-500 flex justify-between items-center transition">
                {cat.title} <span className="text-zinc-600 bg-zinc-950 px-3 py-1 rounded-full text-sm">Select</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RUNS & LEADERBOARD */}
      {view === 'runList' && activeCategory && activeRun && (
        <div className="flex flex-col h-[calc(100vh-80px)]">
          <div className="p-5 pb-2">
            <button onClick={() => setView('categoryList')} className="text-zinc-400 mb-4 font-semibold hover:text-white">← Back</button>
            <h1 className="text-xl font-black mb-4 text-zinc-300">{activeCategory.title}</h1>
            
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {activeCategory.runs.map(run => (
                <button key={run.id} onClick={() => setActiveRun(run)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition ${activeRun.id === run.id ? 'bg-green-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                  {run.title}
                </button>
              ))}
            </div>

            <button onClick={() => { setElapsedMs(0); setCurrentSplitIndex(0); setRecordedSplits([]); setIsRunning(false); setView('timer'); }} className="w-full mt-4 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-lg py-4 rounded-2xl active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition">
              ⏱️ ENTER LIVESPLIT
            </button>
          </div>

          <main className="flex-1 p-5 overflow-y-auto">
            <div className="flex mb-4 bg-zinc-900 p-1 rounded-xl">
              <button onClick={() => setLeaderboardTab('global')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${leaderboardTab === 'global' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Global</button>
              <button onClick={() => setLeaderboardTab('friends')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${leaderboardTab === 'friends' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Friends</button>
            </div>

            <div className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden min-h-[200px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 font-mono text-xs uppercase tracking-wider">
                  <tr><th className="p-4 w-8">#</th><th className="p-4">Player</th><th className="p-4 text-right">Time</th></tr>
                </thead>
                <tbody className="font-mono">
                  {displayedLeaderboard.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-zinc-500 italic font-sans">No runs found. Be the first!</td></tr>
                  ) : (
                    displayedLeaderboard.map((run, i) => (
                      <tr key={run.id} onClick={() => setSelectedRun(run)} className={`border-t border-zinc-800 cursor-pointer hover:bg-zinc-800 transition ${i === 0 ? 'bg-green-500/5 text-green-400' : 'text-zinc-300'}`}>
                        <td className="p-4 font-black">{i + 1}</td>
                        <td className="p-4 font-semibold flex flex-col">
                          <span>{run.userName} {run.userId === user.uid && <span className="text-zinc-500 text-xs ml-1">(You)</span>}</span>
                          {run.hasVideo && <span className="text-[10px] text-green-600 uppercase tracking-widest mt-1">📹 Video</span>}
                        </td>
                        <td className="p-4 font-black text-right text-lg">{run.totalTimeMs ? formatTime(run.totalTimeMs) : '-'}</td>
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
          <button onClick={cancelRun} className="text-red-500 mb-6 font-bold hover:text-red-400 w-fit">← Cancel Run</button>
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-black text-center mb-8 text-zinc-100">{activeRun.title}</h2>
            <div className="flex-1 space-y-3">
              {activeRun.splits.map((split, idx) => {
                const isCompleted = idx < currentSplitIndex || (!isRunning && recordedSplits.length > 0);
                const isActive = idx === currentSplitIndex && isRunning;
                return (
                  <div key={idx} className={`flex justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-zinc-800 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)] scale-[1.02]' : 'bg-zinc-900 border-zinc-800'} ${isCompleted ? 'opacity-40' : ''}`}>
                    <span className="font-bold">{split}</span>
                    <span className="font-mono font-bold text-lg">{isCompleted ? formatTime(recordedSplits[idx]) : '-:--.--'}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center my-8 text-[5rem] leading-none font-black font-mono text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              {formatTime(elapsedMs)}
            </div>
            <button onClick={handleSplit} className={`w-full py-8 rounded-3xl text-4xl font-black active:scale-95 transition-all ${!isRunning ? 'bg-green-500 text-zinc-950' : 'bg-zinc-100 text-zinc-900'}`}>
              {!isRunning && recordedSplits.length === 0 ? 'START' : 'SPLIT'}
            </button>
          </div>
        </div>
      )}

      {/* SUBMISSION SCREEN */}
      {view === 'submission' && (
        <div className="flex flex-col h-screen p-5 justify-center max-w-sm mx-auto w-full">
          <h2 className="text-4xl font-black text-center mb-2 text-green-500">Run Finished!</h2>
          <div className="text-center text-zinc-400 font-mono mb-10">Final Time: <span className="text-white font-bold">{formatTime(elapsedMs)}</span></div>
          
          <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">YouTube Video Link (Optional)</label>
              <input 
                type="url" placeholder="https://youtube.com/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 outline-none focus:border-green-500 text-sm font-mono placeholder:text-zinc-600"
              />
            </div>
            <button type="submit" className="w-full bg-green-500 text-zinc-950 py-5 rounded-2xl font-black text-xl active:scale-95 mt-4 shadow-[0_0_20px_rgba(34,197,94,0.3)]">Submit to Leaderboard</button>
            <button type="button" onClick={cancelRun} className="w-full bg-zinc-900 text-red-500 py-4 rounded-2xl font-bold border border-zinc-800 active:scale-95 hover:bg-zinc-800 transition">Discard Run</button>
          </form>
        </div>
      )}

    </div>
  );
}