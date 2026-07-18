import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Gamepad2, Megaphone, BarChart3, Trash2, 
  UserCheck, UserX, Coins, Plus, Settings, Check, Send
} from 'lucide-react';
import { getTranslation, Language } from '../utils/translations';
import { UserProfile, Game, AppAnnouncement, AppAnalytics } from '../types';
import { audio } from '../utils/audio';

interface AdminPanelProps {
  lang: Language;
  user: UserProfile;
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
  announcements: AppAnnouncement[];
  setAnnouncements: Dispatch<SetStateAction<AppAnnouncement[]>>;
  onUpdateUserCoins: (amount: number) => void;
  triggerPushNotification: (title: string, body: string) => void;
}

interface SimulatedUser {
  uid: string;
  email: string;
  displayName: string;
  coins: number;
  streak: number;
  isBanned: boolean;
  role: 'user' | 'admin';
}

const INITIAL_SIMULATED_USERS: SimulatedUser[] = [
  { uid: 'u1', email: 'cortex@king.com', displayName: 'CortexKing', coins: 450, streak: 8, isBanned: false, role: 'user' },
  { uid: 'u2', email: 'synapse@magic.com', displayName: 'SynapseWizard', coins: 890, streak: 12, isBanned: false, role: 'user' },
  { uid: 'u3', email: 'ninja@cortex.com', displayName: 'NeuronNinja', coins: 120, streak: 2, isBanned: false, role: 'user' },
  { uid: 'u4', email: 'liam@brother.com', displayName: 'Liam (Brother)', coins: 340, streak: 4, isBanned: false, role: 'user' },
  { uid: 'u5', email: 'sophia@bestie.com', displayName: 'Sophia (Bestie)', coins: 610, streak: 7, isBanned: false, role: 'user' }
];

export default function AdminPanel({
  lang,
  user,
  games,
  setGames,
  announcements,
  setAnnouncements,
  onUpdateUserCoins,
  triggerPushNotification
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'announcements' | 'analytics'>('analytics');
  const [simulatedUsers, setSimulatedUsers] = useState<SimulatedUser[]>([
    ...INITIAL_SIMULATED_USERS,
    { uid: user.uid, email: user.email, displayName: user.displayName + ' (You)', coins: user.coins, streak: user.streak, isBanned: false, role: 'admin' }
  ]);

  // Announcement fields
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // New Game custom configurations
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const [newCost, setNewCost] = useState(0);

  // App analytics mock values
  const analytics: AppAnalytics = {
    totalUsers: simulatedUsers.length + 32,
    avgBrainScore: 4280,
    activeToday: 18,
    totalCoinsDistributed: simulatedUsers.reduce((sum, u) => sum + u.coins, 0) + 1240,
    gamePlays: {
      'Memory Match': 45,
      'Math Challenge': 68,
      'Reaction Speed Test': 84,
      'Pattern Recognition': 32,
      'Color & Shape Memory': 29,
      'Number Puzzle': 41,
      'IQ Quiz': 51
    }
  };

  const handleUpdateCoins = (uid: string, amount: number) => {
    audio.playTap();
    setSimulatedUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        const next = Math.max(0, u.coins + amount);
        if (u.uid === user.uid) {
          onUpdateUserCoins(amount);
        }
        return { ...u, coins: next };
      }
      return u;
    }));
  };

  const handleToggleBan = (uid: string) => {
    audio.playTap();
    setSimulatedUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        return { ...u, isBanned: !u.isBanned };
      }
      return u;
    }));
  };

  const handleSendAnnouncement = (e: FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    audio.playSuccess();

    const newAnnouncement: AppAnnouncement = {
      id: 'ann_' + Date.now(),
      title: announcementTitle,
      content: announcementContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'System Admin'
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    
    // Broadcast push notification to client
    triggerPushNotification(announcementTitle, announcementContent);

    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementSuccess(true);
    setTimeout(() => setAnnouncementSuccess(false), 3000);
  };

  const handleSavePrice = (id: string) => {
    audio.playTap();
    setGames(prev => prev.map(g => g.id === id ? { ...g, coinCost: newCost } : g));
    setEditPriceId(null);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-header */}
      <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
        {[
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'games', label: 'Games Config', icon: Gamepad2 },
          { id: 'announcements', label: 'Broadcast', icon: Megaphone }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                audio.playTap();
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 py-3 px-1 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider flex flex-col md:flex-row items-center justify-center gap-1 transition-all cursor-pointer border ${
                active 
                  ? 'bg-white text-[#0A0E21] border-white shadow-xl shadow-cyan-500/5' 
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Screen Sections */}
      <div>
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Active Brain Trainers', value: analytics.totalUsers, color: 'text-cyan-400' },
                { label: 'Avg Brain Score', value: analytics.avgBrainScore, color: 'text-purple-400' },
                { label: 'Active Today', value: analytics.activeToday, color: 'text-emerald-400' },
                { label: 'Rewards Distributed', value: analytics.totalCoinsDistributed, color: 'text-yellow-400' }
              ].map((m, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[24px] p-4 text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-1">{m.label}</p>
                  <p className={`text-2xl font-black font-display tracking-tight uppercase ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Popular game plays analytics bar chart */}
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md">
              <h3 className="text-lg font-black font-display text-white uppercase tracking-tight mb-4">Cognitive Category Popularity (Plays)</h3>
              <div className="space-y-3.5">
                {Object.entries(analytics.gamePlays).map(([category, count]) => {
                  const maxVal = Math.max(...Object.values(analytics.gamePlays));
                  const percentage = (count / maxVal) * 100;

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                        <span className="text-gray-300">{category}</span>
                        <span className="text-cyan-400">{count} rounds</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md space-y-4">
            <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">{getTranslation(lang, 'adminManageUsers')}</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {simulatedUsers.map((u) => (
                <div 
                  key={u.uid}
                  className={`flex items-center justify-between p-3.5 rounded-[20px] border border-white/5 ${
                    u.isBanned ? 'bg-red-950/20 opacity-70' : 'bg-white/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black uppercase tracking-tight text-white">{u.displayName}</p>
                      {u.role === 'admin' && (
                        <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                          Admin
                        </span>
                      )}
                      {u.isBanned && (
                        <span className="text-[8px] bg-red-500/20 text-red-300 border border-red-500/25 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                          Banned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                    <p className="text-[9px] text-yellow-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-yellow-500" />
                      {u.coins} Coins
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdateCoins(u.uid, 100)}
                      className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/20 text-yellow-400 transition-all cursor-pointer"
                      title="Grant 100 Coins"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBan(u.uid)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          u.isBanned 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                        }`}
                        title={u.isBanned ? 'Unban User' : 'Ban User'}
                      >
                        {u.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md space-y-4">
            <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">Unlock Price Configuration</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {games.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-[20px] border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-tight text-white">{g.name}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">{g.category}</p>
                    <p className="text-[9px] text-purple-400 uppercase tracking-wider font-black">
                      {g.isUnlocked ? 'Default Unlocked' : `${g.coinCost} Coins Cost`}
                    </p>
                  </div>

                  {/* Pricing adjustment trigger */}
                  {!g.isUnlocked && (
                    <div className="flex gap-2">
                      {editPriceId === g.id ? (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            value={newCost}
                            onChange={(e) => setNewCost(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 rounded bg-slate-900 border border-white/25 text-white text-xs outline-none"
                          />
                          <button
                            onClick={() => handleSavePrice(g.id)}
                            className="p-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            audio.playTap();
                            setEditPriceId(g.id);
                            setNewCost(g.coinCost);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all cursor-pointer"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md space-y-4">
            <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">{getTranslation(lang, 'adminAnnouncements')}</h3>
            
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">Broadcast Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Game Category Active!"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0A0E21]/60 border border-white/10 text-white text-xs focus:border-cyan-400 outline-none transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black px-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Broadcast instructions to all simulated live brain trainers..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0A0E21]/60 border border-white/10 text-white text-xs focus:border-cyan-400 outline-none transition-all resize-none placeholder:text-gray-500"
                />
              </div>

              <AnimatePresence>
                {announcementSuccess && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{getTranslation(lang, 'adminNotificationSuccess')}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-white text-[#0A0E21] hover:bg-gray-100 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl active:scale-95"
              >
                <Send className="w-4 h-4 text-[#0A0E21]" />
                <span>{getTranslation(lang, 'adminSendAnnouncement')}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
