import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Brain, Mail, Lock, LogIn, Sparkles, User, ShieldCheck } from 'lucide-react';
import { audio } from '../utils/audio';
import { getTranslation, Language } from '../utils/translations';
import { UserProfile } from '../types';

interface AuthScreenProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ lang, setLang, onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = (e: FormEvent) => {
    e.preventDefault();
    audio.playTap();
    setError(null);

    if (isRegistering && !displayName.trim()) {
      setError(lang === 'en' ? 'Please provide a screen name' : 'Por favor ingresa un nombre');
      return;
    }

    if (!email.includes('@') || password.length < 6) {
      setError(lang === 'en' ? 'Invalid credentials (Password min 6 chars)' : 'Credenciales inválidas (mínimo 6 caracteres)');
      return;
    }

    // Simulate successful authentication and store in localStorage
    const simulatedUser: UserProfile = {
      uid: 'email_user_' + Math.random().toString(36).substring(2, 9),
      email: email,
      displayName: isRegistering ? displayName : email.split('@')[0],
      isGuest: false,
      coins: 100, // starting coins
      xp: 0,
      streak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      gamesPlayed: 0,
      badges: [],
      scoresHistory: {},
      unlockedGames: ['memory', 'math', 'reaction'] // default unlocked
    };

    audio.playSuccess();
    onLoginSuccess(simulatedUser);
  };

  const handleGoogleAuth = () => {
    audio.playTap();
    // Simulate premium google login
    const simulatedUser: UserProfile = {
      uid: 'google_user_' + Math.random().toString(36).substring(2, 9),
      email: 'user@gmail.com',
      displayName: 'Alex Mercer',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      isGuest: false,
      coins: 150, // Google login reward bonus
      xp: 0,
      streak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      gamesPlayed: 0,
      badges: [],
      scoresHistory: {},
      unlockedGames: ['memory', 'math', 'reaction']
    };

    audio.playSuccess();
    onLoginSuccess(simulatedUser);
  };

  const handleGuestAuth = () => {
    audio.playTap();
    const guestNames = ['BrainyBeast', 'CortexCrusher', 'MindMage', 'SynapseSlayer', 'LogicLord'];
    const selectedName = guestNames[Math.floor(Math.random() * guestNames.length)] + '#' + Math.floor(Math.random() * 900 + 100);

    const simulatedUser: UserProfile = {
      uid: 'guest_user_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@mindmaster.local',
      displayName: selectedName,
      isGuest: true,
      coins: 50, // Guest starting coins
      xp: 0,
      streak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      gamesPlayed: 0,
      badges: [],
      scoresHistory: {},
      unlockedGames: ['memory', 'math', 'reaction']
    };

    audio.playSuccess();
    onLoginSuccess(simulatedUser);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0A0E21] relative overflow-hidden select-none">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/5 rounded-full filter blur-3xl" />

      {/* Language Switcher at Top */}
      <div className="absolute top-6 right-6 flex gap-2 bg-white/5 border border-white/10 p-1 rounded-xl backdrop-blur-md">
        {(['en', 'es', 'fr'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => {
              audio.playTap();
              setLang(l);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
              lang === l ? 'bg-white text-[#0A0E21] shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl relative"
      >
        {/* App Title Emblem */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 mb-4 relative group">
            <Brain className="w-9 h-9 text-white group-hover:scale-110 transition-all duration-300" />
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 rounded-2xl filter blur-sm opacity-50 -z-10" />
          </div>
          <h1 className="text-4xl font-black font-display tracking-tighter text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-indigo-500 uppercase">
            {getTranslation(lang, 'appName')}
          </h1>
          <p className="text-xs text-slate-400 text-center font-black uppercase tracking-wider">
            {getTranslation(lang, 'appSlogan')}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 rotate-180" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. BrainyCrusher"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0A0E21]/60 border border-white/10 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder:text-gray-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                placeholder={getTranslation(lang, 'emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0A0E21]/60 border border-white/10 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                placeholder={getTranslation(lang, 'passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0A0E21]/60 border border-white/10 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder:text-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-white text-[#0A0E21] hover:bg-gray-100 font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            <LogIn className="w-4 h-4 text-[#0A0E21]" />
            <span>{isRegistering ? getTranslation(lang, 'signupBtn') : getTranslation(lang, 'loginBtn')}</span>
          </button>
        </form>

        <div className="text-center my-4">
          <button
            onClick={() => {
              audio.playTap();
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-xs font-black uppercase tracking-wider text-cyan-300 hover:underline hover:text-cyan-200 transition-all cursor-pointer"
          >
            {isRegistering
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Third Party / Guest Logins */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleAuth}
            className="py-3 px-4 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider text-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.08-1.3-.176-1.86H12.24z"
              />
            </svg>
            <span>Google</span>
          </button>
          <button
            onClick={handleGuestAuth}
            className="py-3 px-4 rounded-2xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/20 text-xs font-black uppercase tracking-wider text-purple-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>{getTranslation(lang, 'guestMode')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
