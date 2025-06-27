import React, { useMemo, useState } from "react";
import { useLeaderboard } from "../../context/LeaderboardContext";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Award,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
} from "lucide-react";
import clsx from "clsx";

const achievementBadges: Record<string, { label: string; color: string }> = {
  "Top 1%": { label: "Top 1%", color: "bg-gradient-to-r from-yellow-400 to-orange-500" },
  "Top 10%": { label: "Top 10%", color: "bg-gradient-to-r from-teal-400 to-green-500" },
  "Streak Master": { label: "Streak", color: "bg-gradient-to-r from-pink-500 to-red-400" },
  "Comeback Kid": { label: "Comeback", color: "bg-gradient-to-r from-blue-400 to-purple-500" },
};

const badgeIcon = (badge: string) => (
  <span
    key={badge}
    className={clsx(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mr-1 animate-fade-in",
      achievementBadges[badge]?.color || "bg-gray-700",
      "text-white shadow-sm"
    )}
  >
    <Award className="w-3 h-3 mr-1" />
    {achievementBadges[badge]?.label || badge}
  </span>
);

function LeaderProfileModal({ leader, onClose }: { leader: any; onClose: () => void }) {
  if (!leader) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in-fast">
      <div className="bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-700 relative animate-slide-in-up">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
          onClick={onClose}
        >
          <X />
        </button>
        <div className="flex flex-col items-center">
          <img
            src={leader.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${leader.name}`}
            className="w-24 h-24 rounded-full shadow-lg border-4 border-blue-500"
            alt={leader.name}
          />
          <h2 className="text-2xl font-bold mt-3 text-white">{leader.name}</h2>
          <p className="text-gray-400">Rank #{leader.rank} — {leader.score} pts</p>
          <div className="mt-2">{(leader.achievements || []).map(badgeIcon)}</div>
          <div className="mt-5 w-full">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-gray-200">
              <div>
                <span className="font-bold block text-lg">{leader.stats?.wins ?? 0}</span>
                <span className="text-xs text-gray-400">Wins</span>
              </div>
              <div>
                <span className="font-bold block text-lg">{leader.stats?.losses ?? 0}</span>
                <span className="text-xs text-gray-400">Losses</span>
              </div>
              <div>
                <span className="font-bold block text-lg">{leader.stats?.gamesPlayed ?? 0}</span>
                <span className="text-xs text-gray-400">Games</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const {
    leaders,
    addLeader,
    updateLeader,
    removeLeader,
  } = useLeaderboard();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Filtering logic
  const filteredLeaders = useMemo(() => {
    return leaders
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          (l.achievements || []).some((a: string) =>
            a.toLowerCase().includes(search.toLowerCase())
          )
      );
  }, [leaders, search]);

  // Add/Edit Form State
  const [form, setForm] = useState({
    name: "",
    score: 0,
    avatar: "",
    achievements: [] as string[],
    stats: { gamesPlayed: 0, wins: 0, losses: 0 },
  });

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing !== null) {
      await updateLeader(editing, form);
      setEditing(null);
    } else {
      await addLeader(form);
    }
    setForm({ name: "", score: 0, avatar: "", achievements: [], stats: { gamesPlayed: 0, wins: 0, losses: 0 } });
    setShowAdd(false);
  };

  // Prepare Edit
  const handleEdit = (leader: any) => {
    setForm({
      name: leader.name,
      score: leader.score,
      avatar: leader.avatar || "",
      achievements: leader.achievements || [],
      stats: leader.stats || { gamesPlayed: 0, wins: 0, losses: 0 },
    });
    setEditing(leader.id);
    setShowAdd(true);
  };

  // Animations
  const rowAnim = "transform transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">🏆 Leaderboard</h1>
        <div className="flex gap-2">
          <button
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
            onClick={() => {
              setShowAdd((v) => !v);
              setEditing(null);
              setForm({ name: "", score: 0, avatar: "", achievements: [], stats: { gamesPlayed: 0, wins: 0, losses: 0 } });
            }}
          >
            <UserPlus className="w-4 h-4" />
            Add Leader
          </button>
          <a
            href="/liveboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-700 hover:bg-pruple-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
          >
            <Radio className="w-4 h-4"/>
            LiveBoard
          </a>
        </div>
      </div>
      {/* Search */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 w-full md:w-1/2">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search leaders or achievements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-gray-200 placeholder-gray-400"
          />
        </div>
      </div>
      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center animate-fade-in-fast">
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 w-full max-w-md shadow-2xl animate-slide-in-up relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
              onClick={() => {
                setShowAdd(false);
                setEditing(null);
              }}
            >
              <X />
            </button>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <h2 className="text-xl font-bold">{editing ? "Edit Leader" : "Add Leader"}</h2>
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  className="w-full bg-gray-800 rounded px-3 py-2 border border-gray-700 focus:border-blue-500 outline-none"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Score</label>
                <input
                  type="number"
                  className="w-full bg-gray-800 rounded px-3 py-2 border border-gray-700 focus:border-blue-500 outline-none"
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Avatar URL (optional)</label>
                <input
                  className="w-full bg-gray-800 rounded px-3 py-2 border border-gray-700 focus:border-blue-500 outline-none"
                  value={form.avatar}
                  onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Achievements (comma separated)</label>
                <input
                  className="w-full bg-gray-800 rounded px-3 py-2 border border-gray-700 focus:border-blue-500 outline-none"
                  value={form.achievements.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      achievements: e.target.value
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-300 mb-1 text-xs">Games</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 rounded px-2 py-1 border border-gray-700"
                    value={form.stats.gamesPlayed}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stats: { ...f.stats, gamesPlayed: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-xs">Wins</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 rounded px-2 py-1 border border-gray-700"
                    value={form.stats.wins}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stats: { ...f.stats, wins: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-xs">Losses</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 rounded px-2 py-1 border border-gray-700"
                    value={form.stats.losses}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stats: { ...f.stats, losses: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>
              <button
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-bold mt-4 shadow"
                type="submit"
              >
                {editing ? "Update" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}



      {/* Profile Modal */}
      {profile && (
        <LeaderProfileModal leader={profile} onClose={() => setProfile(null)} />
      )}

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 shadow-lg animate-fade-in">
        <table className="min-w-full divide-y divide-gray-700 bg-gray-900/95">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-gray-300">Rank</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-300">Player</th>
              <th className="py-3 px-4 font-semibold text-gray-300">Score</th>
              <th className="py-3 px-4 font-semibold text-gray-300">Badges</th>
              <th className="py-3 px-4 font-semibold text-gray-300">Progress</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaders.map((l) => (
              <React.Fragment key={l.id}>
                <tr className={clsx("group hover:bg-blue-900/20", rowAnim)}>
                  <td className="py-3 px-4">
                    <span
                      className={clsx(
                        "inline-block font-bold text-lg",
                        l.rank === 1
                          ? "text-yellow-400 animate-pop"
                          : l.rank === 2
                          ? "text-gray-200"
                          : l.rank === 3
                          ? "text-orange-400"
                          : "text-gray-400"
                      )}
                    >
                      {l.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={l.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${l.name}`}
                      className="w-8 h-8 rounded-full border-2 border-blue-600 shadow"
                      alt={l.name}
                    />
                    <span
                      className="cursor-pointer hover:underline text-white"
                      onClick={() => setProfile(l)}
                    >
                      {l.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-300">{l.score}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">{(l.achievements || []).map(badgeIcon)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-28 h-3 bg-gray-800 rounded-full relative overflow-hidden">
                      <div
                        className={clsx(
                          "absolute left-0 top-0 h-3 rounded-full transition-all duration-1000",
                          l.rank === 1
                            ? "bg-gradient-to-r from-yellow-400 to-blue-400"
                            : "bg-gradient-to-r from-blue-500 to-green-500"
                        )}
                        style={{
                          width: `${
                            filteredLeaders[0]
                              ? Math.min(100, (l.score / (filteredLeaders[0].score || 1)) * 100)
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        className="text-blue-400 hover:text-blue-600"
                        onClick={() => setExpanded((eid) => (eid === l.id ? null : l.id))}
                        aria-label="Details"
                      >
                        {expanded === l.id ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      <button
                        className="text-green-400 hover:text-green-600"
                        onClick={() => handleEdit(l)}
                        aria-label="Edit"
                      >
                        <Edit2 />
                      </button>
                      <button
                        className="text-red-400 hover:text-red-600"
                        onClick={() => window.confirm("Remove this leader?") && removeLeader(l.id)}
                        aria-label="Delete"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded row for details */}
                {expanded === l.id && (
                  <tr key={l.id + "-expanded"} className="bg-gray-800/80 animate-fade-in">
                    <td colSpan={6} className="p-4">
                      <div className="flex gap-8 items-center">
                        <div>
                          <img
                            src={l.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${l.name}`}
                            className="w-20 h-20 rounded-full border-4 border-blue-600"
                            alt={l.name}
                          />
                          <div className="mt-2 flex gap-1">{(l.achievements || []).map(badgeIcon)}</div>
                        </div>
                        <div>
                          <p className="font-bold text-lg mb-2 text-white">{l.name}</p>
                          <div className="flex gap-6">
                            <div>
                              <span className="block text-blue-300 font-bold text-xl">{l.stats?.wins ?? 0}</span>
                              <span className="text-xs text-gray-400">Wins</span>
                            </div>
                            <div>
                              <span className="block text-red-300 font-bold text-xl">{l.stats?.losses ?? 0}</span>
                              <span className="text-xs text-gray-400">Losses</span>
                            </div>
                            <div>
                              <span className="block text-gray-200 font-bold text-xl">{l.stats?.gamesPlayed ?? 0}</span>
                              <span className="text-xs text-gray-400">Games</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* Animation styles */}
      <style>{`
        .animate-fade-in-fast { animation: fadeIn 0.25s; }
        .animate-fade-in { animation: fadeIn 0.5s; }
        .animate-slide-in-up { animation: slideInUp 0.4s; }
        .animate-pop { animation: pop 0.35s; }
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes slideInUp { from {opacity:0; transform:translateY(60px);} to {opacity:1; transform:translateY(0);} }
        @keyframes pop { 0%{transform:scale(1);} 60%{transform:scale(1.16);} 80%{transform:scale(0.95);} 100%{transform:scale(1);} }
      `}</style>
    </div>
  );
}

export default Leaderboard;