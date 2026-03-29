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

import logo from './assets/anypercentlogoTrans.png';

// --- DATA STRUCTURE: Strictly 2-Layer with Green Theme ---
const ZONES = [
  { id: 'kitchen', title: 'Kitchen', icon: '🍳', primary: 'emerald', colors: 'from-emerald-400 to-green-500' },
  { id: 'food', title: 'Food', icon: '🍕', primary: 'teal', colors: 'from-teal-400 to-cyan-500' },
  { id: 'bedroom', title: 'Bedroom', icon: '🛏️', primary: 'lime', colors: 'from-lime-400 to-green-400' },
  { id: 'washroom', title: 'Washroom', icon: '🚿', primary: 'green', colors: 'from-green-400 to-teal-600' },
  { id: 'everyday', title: 'Everyday', icon: '👟', primary: 'teal', colors: 'from-emerald-400 to-teal-500' },
  { id: 'outdoor', title: 'Outdoor', icon: '🌱', primary: 'green', colors: 'from-emerald-500 to-green-600' }
];

// Mapping Categories immediately so hierarchy is 2-layer
const TASK_LIST = {
  'cooking': {
    zone: 'kitchen', title: 'Cooking',
    runs: [
      { id: 'scrambled_eggs', title: 'Scrambled eggs', splits: ['Crack/Whisk', 'Pan Fry', 'Plate'] },
      { id: 'fried_rice', title: 'Fried rice', splits: ['Prep Veg', 'Fry Rice', 'Serve'] }
    ]
  },
  'fruits_veg': {
    zone: 'kitchen', title: 'Fruits & Veg',
    runs: [
      { id: 'peel_orange', title: 'Peeling orange', splits: ['Peel', 'Separate'] },
      { id: 'slice_apple', title: 'Slicing apple', splits: ['Core', 'Slice'] },
      { id: 'dice_onion', title: 'Dicing onion', splits: ['Peel', 'Dice'] }
    ]
  },
  'washing_dishes': {
    zone: 'kitchen', title: 'Washing dishes',
    runs: [
      { id: 'wash_10', title: 'Wash 10 Dishes', splits: ['Washing', 'Rinse'] },
      { id: 'unload_dw', title: 'Unload Dishwasher', splits: ['Bottom Rack', 'Top Rack', 'Cutlery'] }
    ]
  },
  'banana': {
    zone: 'food', title: 'Banana', runs: [{ id: 'eat_banana', title: 'Peel + Eat', splits: ['Complete'] }]
  },
  'hot_dog': {
    zone: 'food', title: 'Hot Dog', runs: [{ id: 'hd_1', title: '1 dog', splits: ['Complete'] }, { id: 'hd_3', title: '3 dogs', splits: ['Dog 1', 'Dog 2', 'Dog 3'] }]
  },
  'donut': {
    zone: 'food', title: 'Donuts', runs: [{ id: 'donut_3', title: '3 doughnut doughnut', splits: ['Donut 1', 'Donut 2', 'Donut 3'] }]
  },
  'pizza': {
    zone: 'food', title: 'Pizza', runs: [{ id: 'pizza_1', title: '1 pizza', splits: ['Complete'] }, { id: 'pizza_3', title: '3 pizzas', splits: ['Pizza 1', 'Pizza 2', 'Pizza 3'] }]
  },
  'morning': {
    zone: 'bedroom', title: 'Morning Routines',
    runs: [
      { id: 'get_up', title: 'Get Up Routine', splits: ['Get Up', 'Get Dressed'] },
      { id: 'make_bed', title: 'Making bed', splits: ['Clear Bed', 'Pull Sheets', 'Pillows'] }
    ]
  },
  'dressed': {
    zone: 'bedroom', title: 'Getting dressed',
    runs: [
      { id: 'dress_formal', title: 'Formal wear', splits: ['Formal Top', ' Formal Bottom', 'Shoes'] },
      { id: 'dress_casual', title: 'Casual', splits: ['Sweats', 'Shoes'] }
    ]
  },
  'hygiene': {
    zone: 'washroom', title: 'Hygiene',
    runs: [
      { id: 'teeth', title: 'Teeth Cleaning', splits: ['Brush', 'Floss'] },
      { id: 'shower', title: 'Shower Any%', splits: ['Wash', 'Dry'] }
    ]
  },
  'grooming': {
    zone: 'washroom', title: 'Grooming',
    runs: [{ id: 'shave_full', title: 'Shaving beard', splits: ['Cream', 'Shave', 'Aftershave'] }, { id: 'nails_both', title: 'Clipping nails', splits: ['Hands', 'Feet'] }]
  },
  'shoes': {
    zone: 'everyday', title: 'Tying shoes',
    runs: [
      { id: 'shoe_1', title: '1 shoe', splits: ['Complete'] },
      { id: 'shoe_2', title: '2 shoes', splits: ['First Shoe', 'Second Shoe'] },
      { id: 'shoe_lace', title: 'Lacing full shoe', splits: ['Middle', 'Complete'] }
    ]
  },
  'yard': {
    zone: 'outdoor', title: 'Yard Work',
    runs: [{ id: 'mow', title: 'Mowing Lawn', splits: ['Start Engine', 'Mow', 'Put Away'] }]
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ friends: [] }); 
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // APP NAVIGATION 
  const [view, setView] = useState('home'); 
  const [activeZone, setActiveZone] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  
  // Leaderboard & Following
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('global');
  const [hideRepeats, setHideRepeats] = useState(true); 
  const [hubTab, setHubTab] = useState('following'); 
  
  const [friendSearch, setFriendSearch] = useState('');
  const [resolvedFollowing, setResolvedFollowing] = useState([]); 
  const [resolvedFollowers, setResolvedFollowers] = useState([]); 
  const [selectedRun, setSelectedRun] = useState(null); 
  
  // Timer & Submission
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSplitIndex, setCurrentSplitIndex] = useState(0);
  const [recordedSplits, setRecordedSplits] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const formatTime = (ms) => {
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
            setNewUsername(userSnap.data().displayName);
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
    if (!newUsername.trim()) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName: newUsername });
      setUserData(prev => ({ ...prev, displayName: newUsername }));
      
      const q = query(collection(db, 'runs'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(runDoc => updateDoc(doc(db, 'runs', runDoc.id), { userName: newUsername }));
      await Promise.all(updatePromises);

      alert("Profile and past runs updated successfully!");
      setView('home');
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  useEffect(() => {
    if (view === 'friends') {
      const fetchFollowing = async () => {
        if (userData.friends?.length > 0) {
          const followingData = await Promise.all(
            userData.friends.map(async (uid) => {
              const snap = await getDoc(doc(db, 'users', uid));
              return { id: uid, ...snap.data() };
            })
          );
          setResolvedFollowing(followingData);
        } else {
          setResolvedFollowing([]);
        }
      };

      const fetchFollowers = async () => {
        try {
          const q = query(collection(db, 'users'), where('friends', 'array-contains', user.uid));
          const snap = await getDocs(q);
          const followersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setResolvedFollowers(followersData);
        } catch (error) {
          console.error("Error fetching followers:", error);
        }
      };

      fetchFollowing();
      fetchFollowers();
    }
  }, [view, userData.friends, user?.uid]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendSearch.trim()) return;
    try {
      const q = query(collection(db, 'users'), where('displayName', '==', friendSearch));
      const snap = await getDocs(q);
      if (snap.empty) return alert("Player not found! Check exact spelling.");
      
      const friendId = snap.docs[0].id;
      if (friendId === user.uid) return alert("You can't follow yourself!");
      if (userData.friends?.includes(friendId)) return alert("Already following!");

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

  useEffect(() => {
    if (view === 'runList' && activeRun) {
      const fetchLeaderboard = async () => {
        try {
          const q = query(collection(db, 'runs'), where('runId', '==', activeRun.id), orderBy('totalTimeMs', 'asc'), limit(200));
          const snap = await getDocs(q);
          setLeaderboard(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Index Error:", error);
        }
      };
      fetchLeaderboard();
    }
  }, [view, activeRun]);

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
      setView('submission'); 
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
      cancelRun(); 
    } catch (error) {
      alert("Failed to submit run.");
    }
  };

  let displayedLeaderboard = leaderboard.filter(run => {
    if (leaderboardTab === 'global') return true;
    return run.userId === user.uid || userData.friends?.includes(run.userId);
  });

  if (hideRepeats) {
    const seenUsers = new Set();
    displayedLeaderboard = displayedLeaderboard.filter(run => {
      if (seenUsers.has(run.userId)) return false;
      seenUsers.add(run.userId);
      return true;
    });
  }

  const getGlowColor = () => {
    if (activeZone?.primary === 'lime') return 'drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]';
    if (activeZone?.primary === 'teal') return 'drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]';
    if (activeZone?.primary === 'emerald') return 'drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]';
    return 'drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]';
  };

  const getPrimaryButton = () => {
    if (activeZone?.primary === 'lime') return 'bg-lime-500 hover:bg-lime-400';
    if (activeZone?.primary === 'teal') return 'bg-teal-500 hover:bg-teal-400';
    if (activeZone?.primary === 'emerald') return 'bg-emerald-500 hover:bg-emerald-400';
    return 'bg-green-500 hover:bg-green-400';
  };

  const getActiveTab = () => {
    if (activeZone?.primary === 'lime') return 'from-lime-400 to-lime-500';
    if (activeZone?.primary === 'teal') return 'from-teal-400 to-cyan-500';
    if (activeZone?.primary === 'emerald') return 'from-emerald-400 to-green-500';
    return 'from-green-400 to-emerald-500';
  };

  const getActiveTextColor = () => {
    if (activeZone?.primary === 'lime') return 'text-lime-400';
    if (activeZone?.primary === 'teal') return 'text-teal-400';
    if (activeZone?.primary === 'emerald') return 'text-emerald-400';
    return 'text-green-400';
  };

  const getActiveBorder = () => {
    if (activeZone?.primary === 'lime') return 'focus:border-lime-400';
    if (activeZone?.primary === 'teal') return 'focus:border-teal-400';
    if (activeZone?.primary === 'emerald') return 'focus:border-emerald-400';
    return 'focus:border-green-400';
  };

  if (authLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500 font-bold tracking-widest animate-pulse">Loading Any%...</div>;

  const BubblyBackground = () => (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      <div className="absolute top-[10%] left-[20%] w-[50svw] h-[50svw] rounded-full bg-gradient-to-br from-green-500/20 to-teal-400/10 blur-[90px] animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[40svw] h-[40svw] rounded-full bg-gradient-to-br from-lime-500/15 to-emerald-400/10 blur-[100px] animate-pulse animation-delay-2000"></div>
      <div className="absolute top-[60%] left-[-10%] w-[60svw] h-[60svw] rounded-full bg-gradient-to-br from-emerald-600/10 to-green-500/5 blur-[120px] animate-pulse animation-delay-4000"></div>
      <div className="absolute -top-[10%] -right-[10%] w-[40svw] h-[40svw] rounded-full bg-gradient-to-br from-teal-600/15 to-cyan-500/10 blur-[80px] animate-pulse animation-delay-1000"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-5 relative overflow-hidden font-sans">
        <BubblyBackground />
        
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 flex flex-col items-center">
          <div className="mb-10 w-full flex justify-center">
            <img src={logo} alt="Any% Logo" className="h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          </div>
          <form onSubmit={(e) => handleAuth(e, false)} className="w-full flex flex-col gap-4 mb-6">
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required 
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-green-400 focus:bg-zinc-800 transition-all shadow-inner text-white placeholder:text-zinc-500" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required 
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-green-400 focus:bg-zinc-800 transition-all shadow-inner text-white placeholder:text-zinc-500" />
            <button type="submit" className="bg-gradient-to-r from-green-400 via-emerald-500 to-green-500 text-zinc-950 font-black text-xl py-4 rounded-full shadow-lg shadow-green-500/30 active:scale-95 transition-all mt-2">
              {authMode === 'login' ? 'Continue ▻' : 'Register Now ▻'}
            </button>
          </form>
          
          <div className="flex items-center gap-3 w-full mb-6 opacity-40">
            <div className="h-px bg-white flex-1"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">or</span>
            <div className="h-px bg-white flex-1"></div>
          </div>

          <button onClick={(e) => handleAuth(e, true)} className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold text-lg py-4 rounded-full shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            Continue with Google
          </button>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-zinc-400 hover:text-white text-sm font-semibold transition">
            {authMode === 'login' ? "Register a new account" : "Login with existing account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-green-500/30 relative overflow-hidden">
      <BubblyBackground />
      
      {selectedRun && (
        <div className="fixed inset-0 bg-zinc-950/80 z-50 flex items-center justify-center p-5 backdrop-blur-xl">
          <div className="bg-zinc-900/80 p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-zinc-800/80">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent truncate pr-4">
                {selectedRun.userName}'s Run
              </h2>
              <button onClick={() => setSelectedRun(null)} className="bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center font-bold transition">✕</button>
            </div>
            
            <div className="text-center mb-8 bg-zinc-950/50 py-6 rounded-3xl shadow-inner border border-zinc-800/50">
              <div className={`text-5xl font-black tracking-tight ${getActiveTextColor()}`}>{formatTime(selectedRun.totalTimeMs)}</div>
              {selectedRun.hasVideo ? (
                <a href={selectedRun.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-sm hover:bg-emerald-500/20 transition">
                  ▶ Watch Video Proof
                </a>
              ) : (
                <div className="mt-4 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-full font-bold text-sm inline-block">No Video Proof</div>
              )}
            </div>

            <div className="space-y-2 mb-8 max-h-[40svh] overflow-y-auto pr-2 scrollbar-bubbly-green">
              {activeRun.splits.map((splitName, idx) => (
                <div key={idx} className="flex justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800/50">
                  <span className="font-semibold text-zinc-300 text-sm">{splitName}</span>
                  <span className="font-bold text-white text-sm">{formatTime(selectedRun.splits[idx] || 0)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedRun(null)} className="w-full py-4 bg-zinc-100 text-zinc-900 rounded-full font-black text-lg active:scale-95 transition-all shadow-lg">Close Details</button>
          </div>
        </div>
      )}

      {!['timer', 'submission'].includes(view) && (
        <header className="flex justify-between items-center p-4 px-6 bg-zinc-950/70 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/5 relative">
          <div onClick={() => setView('home')} className="flex items-center gap-2 cursor-pointer group">
            <img src={logo} alt="Logo" className="h-10 object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-transform group-hover:scale-105" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('friends')} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-sm font-bold shadow-sm transition-all active:scale-95">👥 My Network</button>
            <button onClick={() => setView('profile')} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-sm font-bold shadow-sm transition-all active:scale-95">⚙️ Profile</button>
          </div>
        </header>
      )}

      <div className="relative z-10 w-full">
        {view === 'profile' && (
          <div className="p-6 max-w-sm mx-auto mt-6">
            <button onClick={() => setView('home')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center mb-6 hover:bg-zinc-800 transition shadow-sm border border-zinc-800">←</button>
            <h2 className="text-3xl font-black mb-8">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-zinc-400 mb-2 block ml-2">Display Name</label>
                <input 
                  type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-green-400 focus:bg-zinc-800 transition-all font-bold text-lg"
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-zinc-950 py-4 rounded-full font-black text-lg shadow-lg shadow-green-500/30 active:scale-95 transition-all mt-4">Save Changes ▻</button>
              <button type="button" onClick={() => signOut(auth)} className="w-full bg-zinc-900 text-red-400 hover:bg-red-500/10 py-4 rounded-full font-bold border border-zinc-800 transition-all mt-3">Log Out</button>
            </form>
          </div>
        )}

        {view === 'friends' && (
          <div className="p-6 max-w-md mx-auto mt-6">
            <button onClick={() => setView('home')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center mb-6 hover:bg-zinc-800 transition shadow-sm border border-zinc-800">←</button>
            <h2 className="text-3xl font-black mb-6">My Network</h2>
            
            <form onSubmit={handleAddFriend} className="flex gap-2 mb-8 bg-zinc-900/80 border border-zinc-700 rounded-full p-1.5 shadow-inner">
              <input 
                type="text" placeholder="Enter Runner Username" value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)}
                className="flex-1 bg-transparent px-4 outline-none font-semibold text-white placeholder:text-zinc-600"
              />
              <button type="submit" className="bg-green-500 text-zinc-950 px-6 py-3 rounded-full font-black shadow-md hover:bg-green-400 transition-all">Follow ▻</button>
            </form>

            <div className="flex mb-4 bg-zinc-900 p-1.5 rounded-2xl shadow-inner border border-zinc-800">
              <button onClick={() => setHubTab('following')} className={'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ' + (hubTab === 'following' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-white')}>I'm Following ({resolvedFollowing.length})</button>
              <button onClick={() => setHubTab('followers')} className={'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ' + (hubTab === 'followers' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-white')}>Followers ({resolvedFollowers.length})</button>
            </div>

            <div className="space-y-3">
              {hubTab === 'following' && (
                resolvedFollowing.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-10 text-center">
                    <span className="text-4xl mb-3 block">👀</span>
                    <p className="text-zinc-400 font-semibold">You're not following anyone yet.</p>
                  </div>
                ) : (
                  resolvedFollowing.map(friend => (
                    <div key={friend.id} className="flex justify-between items-center bg-zinc-900/80 p-4 rounded-full border border-zinc-800 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center font-black shadow-inner text-zinc-950 text-xl">
                          {friend.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-lg text-white">{friend.displayName}</span>
                      </div>
                      <button onClick={() => handleRemoveFriend(friend.id)} className="text-red-400 font-bold bg-zinc-800 hover:bg-red-500/10 px-4 py-2 rounded-full transition-all text-xs">Unfollow</button>
                    </div>
                  ))
                )
              )}

              {hubTab === 'followers' && (
                resolvedFollowers.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-10 text-center">
                    <span className="text-4xl mb-3 block">💨</span>
                    <p className="text-zinc-400 font-semibold">No one is following you yet.</p>
                  </div>
                ) : (
                  resolvedFollowers.map(follower => (
                    <div key={follower.id} className="flex justify-between items-center bg-zinc-900/80 p-4 rounded-full border border-zinc-800 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center font-black shadow-inner text-zinc-950 text-xl">
                          {follower.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-lg text-white">{follower.displayName}</span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 bg-zinc-950 px-3 py-1 rounded-full">Follower</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}

        {view === 'home' && (
          <div className="p-6 max-w-4xl mx-auto mt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ZONES.map((zone) => (
                <button key={zone.id} onClick={() => { setActiveZone(zone); setView('categoryList'); }} 
                  className={`bg-gradient-to-br ${zone.colors} p-6 rounded-[2.5rem] flex flex-col items-center justify-center aspect-square active:scale-95 transition-all shadow-xl hover:-translate-y-1`}
                >
                  <span className="text-5xl mb-3 drop-shadow-md bg-white/20 w-20 h-20 rounded-full flex items-center justify-center">{zone.icon}</span>
                  <span className="font-black text-zinc-950 text-xl tracking-tight drop-shadow-sm">{zone.title} ▻</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'categoryList' && activeZone && (
          <div className="p-6 max-w-4xl mx-auto">
            <button onClick={() => setView('home')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center mb-6 hover:bg-zinc-800 transition shadow-sm border border-zinc-800">←</button>
            
            <div className="flex items-center gap-4 mb-8 bg-zinc-900 p-3 rounded-full border border-zinc-800 w-full max-w-sm shadow-inner">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${activeZone.colors} flex items-center justify-center text-3xl shadow-lg`}>
                {activeZone.icon}
              </div>
              <h1 className="text-2xl font-black">{activeZone.title} Sector</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(TASK_LIST)
                .filter(catKey => TASK_LIST[catKey].zone === activeZone.id)
                .map(catKey => {
                  const catData = TASK_LIST[catKey];
                  return (
                    <button key={catKey} onClick={() => { setActiveCategory(catData); setActiveRun(catData.runs[0]); setView('runList'); }} 
                      className="bg-zinc-900 hover:bg-zinc-800/50 p-6 rounded-full text-left font-bold text-lg active:scale-95 flex justify-between items-center transition-all group border border-zinc-800 shadow-sm"
                    >
                      <span className="text-white flex items-center gap-3">
                        <span className={'w-3 h-3 rounded-full bg-gradient-to-br ' + getActiveTab()}></span>
                        {catData.title}
                      </span> 
                      <span className="bg-zinc-950 text-zinc-600 group-hover:bg-green-500 group-hover:text-zinc-950 px-4 py-2 rounded-full text-sm font-semibold transition-all">View ◅</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {view === 'runList' && activeCategory && activeRun && (
          <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto w-full relative">
            <div className="p-6 pb-2">
              <button onClick={() => setView('categoryList')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center mb-4 hover:bg-zinc-800 transition shadow-sm border border-zinc-800">←</button>
              <h1 className="text-sm font-bold mb-2 text-zinc-500 uppercase tracking-widest">{activeCategory.title} Categories</h1>
              
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-bubbly-green">
                {activeCategory.runs.map(run => (
                  <button key={run.id} onClick={() => setActiveRun(run)} 
                    className={'whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all shadow-sm ' + (activeRun.id === run.id ? 'bg-gradient-to-r ' + getActiveTab() + ' text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white')}>
                    {run.title}
                  </button>
                ))}
              </div>

              <button onClick={() => { setElapsedMs(0); setCurrentSplitIndex(0); setRecordedSplits([]); setIsRunning(false); setView('timer'); }} 
                className={'w-full mt-3 text-zinc-950 font-black text-xl py-5 rounded-[2rem] active:scale-95 shadow-xl transition-all flex items-center justify-center gap-3 ' + getPrimaryButton()}>
                ⏱ Enter LiveSplit ◅
              </button>
            </div>

            <main className="flex-1 p-6 overflow-y-auto relative pr-2 scrollbar-bubbly-green">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl shadow-inner border border-zinc-800">
                  <button onClick={() => setLeaderboardTab('global')} className={'px-6 py-2.5 text-sm font-bold rounded-xl transition-all ' + (leaderboardTab === 'global' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-white')}>Global</button>
                  <button onClick={() => setLeaderboardTab('friends')} className={'px-6 py-2.5 text-sm font-bold rounded-xl transition-all ' + (leaderboardTab === 'friends' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-white')}>Following</button>
                </div>
                
                <button onClick={() => setHideRepeats(!hideRepeats)} className="bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-300 transition-all flex items-center gap-2 shadow-sm">
                  <div className={'w-4 h-4 rounded-md flex items-center justify-center transition-all ' + (hideRepeats ? getGlowColor() + ' ' + getActiveTab() + ' text-zinc-950' : 'bg-zinc-800 border border-zinc-600')}>
                    {hideRepeats && '✓'}
                  </div>
                  Hide Repeats
                </button>
              </div>

              <div className="space-y-3">
                {displayedLeaderboard.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
                    <span className="text-4xl mb-4 block">👻</span>
                    <p className="text-zinc-500 font-bold text-lg">Empty database.<br/>Submit the first time!</p>
                  </div>
                ) : (
                  displayedLeaderboard.map((run, i) => (
                    <div key={run.id} onClick={() => setSelectedRun(run)} 
                      className={'flex items-center justify-between p-5 rounded-[2.2rem] cursor-pointer hover:scale-[1.01] transition-all shadow border ' + (i === 0 ? 'bg-zinc-900 border ' + getActiveTextColor() + ' ' + getGlowColor() : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800')}>
                      
                      <div className="flex items-center gap-4">
                        <div className={'w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-inner ' + (i === 0 ? 'bg-white/10 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400')}>
                          {i + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-white flex items-center gap-2 truncate pr-2 max-w-[200px]">
                            {run.userName} 
                            {run.userId === user.uid && <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                          </span>
                          
                          <div className="mt-1.5">
                            {run.hasVideo ? (
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/30">✓ Video</span>
                            ) : (
                              <span className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-full text-[10px] font-bold border border-zinc-700">No Video</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={'font-black tabular-nums text-2xl tracking-tight ' + (i === 0 ? getActiveTextColor() : 'text-zinc-200')}>
                        {run.totalTimeMs ? formatTime(run.totalTimeMs) : '-'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </main>
          </div>
        )}

        {view === 'timer' && activeRun && (
          <div className="flex flex-col h-screen p-6 max-w-md mx-auto w-full relative z-10 font-sans">
            <div className="flex justify-between items-center mb-8 bg-zinc-900 p-2 pl-4 pr-2 rounded-full border border-zinc-800 shadow-inner">
              <span className="text-sm font-bold text-white truncate pr-4">{activeRun.title}</span>
              <button onClick={cancelRun} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95">Abort ✕</button>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-bubbly-green">
              {activeRun.splits.map((split, idx) => {
                const isCompleted = idx < currentSplitIndex || (!isRunning && recordedSplits.length > 0);
                const isActive = idx === currentSplitIndex && isRunning;
                return (
                  <div key={idx} className={'flex justify-between p-5 rounded-3xl transition-all duration-300 border shadow-sm ' + (isActive ? 'bg-zinc-800 border-2 scale-[1.02] ' + getActiveBorder() + ' ' + getActiveTextColor() + ' ' + getGlowColor() : 'bg-zinc-900 border-zinc-800 text-zinc-400') + (isCompleted ? ' opacity-40' : '')}>
                    <span className="text-lg font-bold tracking-tight">{split}</span>
                    <span className="text-xl font-bold tabular-nums">{isCompleted ? formatTime(recordedSplits[idx]) : '-:--.--'}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 mb-6 bg-zinc-950 p-8 rounded-[3rem] border border-zinc-800 shadow-inner flex justify-center">
              <div className="text-[4rem] sm:text-[5rem] leading-none font-black tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] text-white">
                {formatTime(elapsedMs)}
              </div>
            </div>
            
            <div className="pb-8">
              <button onClick={handleSplit} className={'w-full py-8 rounded-[2.5rem] text-4xl font-black transition-all active:scale-95 shadow-xl ' + (!isRunning ? 'bg-white text-zinc-950 hover:bg-zinc-200' : getPrimaryButton() + ' text-zinc-950')}>
                {!isRunning && recordedSplits.length === 0 ? 'Start ▻' : 'Split'}
              </button>
            </div>
          </div>
        )}

        {view === 'submission' && (
          <div className="flex flex-col h-screen p-6 justify-center max-w-sm mx-auto w-full relative z-10 font-sans">
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-1 rounded-[2.5rem] shadow-2xl shadow-green-500/20 mb-8">
              <div className="bg-zinc-950 p-8 text-center rounded-[2.4rem] h-full w-full border border-white/5">
                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Run Complete</h2>
                <div className="text-6xl font-black text-white tracking-tighter tabular-nums">{formatTime(elapsedMs)}</div>
              </div>
            </div>
            
            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
              <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-inner">
                <label className="text-sm font-bold text-zinc-400 mb-3 blockml-2">Proof Link (YouTube/VOD)</label>
                <input 
                  type="url" placeholder="https://youtube.com/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-green-500 text-white placeholder:text-zinc-600 font-semibold"
                />
              </div>
              <button type="submit" className={'w-full text-zinc-950 py-5 rounded-full font-black text-xl active:scale-95 mt-4 shadow-xl transition-all ' + getPrimaryButton()}>Upload Run ▻</button>
              <button type="button" onClick={cancelRun} className="w-full text-zinc-500 py-4 rounded-full font-bold text-sm active:scale-95 hover:bg-zinc-900 transition-all mt-2 border border-zinc-800">Discard Data</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}