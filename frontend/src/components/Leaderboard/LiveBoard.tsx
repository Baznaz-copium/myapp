import { useEffect, useState } from "react";
import { useLeaderboard } from "../../context/LeaderboardContext";
import { Star, Award, Crown } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";


const AUTO_ROTATE_INTERVAL = 5500;
const GROUP_SIZE = 5;

function Podium({ leaders }: { leaders: any[] }) {
  const podium = [
    leaders[1] || { name: "-", score: "-", avatar: "", achievements: [], rank: 2 },
    leaders[0] || { name: "-", score: "-", avatar: "", achievements: [], rank: 1 },
    leaders[2] || { name: "-", score: "-", avatar: "", achievements: [], rank: 3 },
  ];
  const names = [
    "text-blue-300",
    "text-yellow-700",
    "text-orange-200",
  ];
  const positions = ["2nd", "1st", "3rd"];
  return (
    <div className="flex justify-center items-end gap-6 h-64 w-full max-w-4xl mb-8">
      {podium.map((user, idx) => (
        <motion.div
          key={idx}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: idx * 0.12, duration: 0.8, type: "spring" }}
          className={clsx(
            "flex flex-col items-center relative rounded-2xl select-none",
            idx === 1 && "scale-110 z-10",
            idx === 0 && "scale-95 z-0",
            idx === 2 && "scale-90 z-0",
            "px-7 pb-2 pt-8"
          )}
          style={{
            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
            boxShadow: idx === 1
              ? "0 10px 56px 0 #facc1566"
              : idx === 0
              ? "0 8px 36px #60a5fa77"
              : "0 4px 18px #f59e4277"
          }}
        >
          <Crown className={clsx(
            "absolute -top-6 left-1/2 -translate-x-1/2",
            idx === 1 ? "w-12 h-12 text-yellow-200 animate-bounce" : "w-8 h-8 text-blue-200"
          )} />
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.name}`}
            className={clsx(
              "rounded-full object-cover border-4 shadow-xl bg-white",
              idx === 1 ? "w-24 h-24 border-yellow-400" :
              idx === 0 ? "w-16 h-16 border-blue-400" : "w-14 h-14 border-orange-400"
            )}
            alt={user.name}
          />
          <span className={clsx("font-bold mt-3 text-lg", names[idx])}>{user.name}</span>
          <span className="font-mono text-base text-slate-300">{user.score} pts</span>
          <span className="text-xs text-indigo-200 pb-1">{positions[idx]}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {(user.achievements || []).slice(0, 2).map((a: string) => (
              <span key={a} className="bg-black/40 text-white/90 px-2 py-0.5 rounded-full text-xs flex items-center">
                <Award className="w-3 h-3 mr-1" />{a}
              </span>
            ))}
          </div>
          {idx === 1 &&
            <Star className="w-10 h-10 text-yellow-300 absolute -top-12 left-1/2 -translate-x-1/2 animate-spin-slow" />
          }
        </motion.div>
      ))}
    </div>
  );
}

function AutoRotatingGroupWaves({ users }: { users: any[] }) {
  const [groupIdx, setGroupIdx] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const groupCount = Math.ceil(users.length / GROUP_SIZE);

  useEffect(() => {
    if (groupCount <= 1) return;
    const handle = setInterval(() => {
      setDirection("right");
      setGroupIdx((prev) => (prev + 1) % groupCount);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(handle);
  }, [groupCount]);

  const display = users.slice(groupIdx * GROUP_SIZE, groupIdx * GROUP_SIZE + GROUP_SIZE);
  let fixedDisplay = [...display];
  if (fixedDisplay.length < GROUP_SIZE) {
    fixedDisplay = fixedDisplay.concat(users.slice(0, GROUP_SIZE - fixedDisplay.length));
  }

  // Animate whole wave horizontally
  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md bg-gray-900/70 border border-blue-700/40">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={groupIdx}
          initial={{ opacity: 0, x: direction === "right" ? 150 : -150, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: direction === "right" ? -100 : 100, scale: 0.97, transition: { opacity: { duration: 0.2 } } }}
          transition={{ type: "spring", duration: 0.7, bounce: 0.20 }}
        >
          {fixedDisplay.map((l, _i) => (
            <div
              key={l.id}
              className={clsx(
                "flex items-center gap-4 py-4 px-8 border-b border-blue-800/30 transition-all duration-300",
                "hover:bg-blue-800/10"
              )}
              style={{ fontSize: "1.2rem" }}
            >
              <span className="font-bold text-lg text-indigo-300">{l.rank}</span>
              <img
                src={l.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${l.name}`}
                className="w-10 h-10 rounded-full border-2 border-blue-400 shadow"
                alt={l.name}
              />
              <span className="font-bold text-white text-md">{l.name}</span>
              <span className="ml-auto text-blue-200 font-mono text-md">{l.score} pts</span>
              <div className="flex gap-1 ml-3">
                {(l.achievements || []).slice(0, 2).map((a: string) => (
                  <span key={a} className="bg-blue-700/70 text-white px-2 py-0.5 rounded-full text-xs flex items-center">
                    <Award className="w-3 h-3 mr-1" /> {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Liveboard() {
  const { leaders, refresh } = useLeaderboard();

  // Poll for updates every 10s
  useEffect(() => {
    const i = setInterval(refresh, 10000);
    return () => clearInterval(i);
  }, [refresh]);

  const sortedLeaders = [...leaders].sort((a, b) => a.rank - b.rank);
  const top3 = sortedLeaders.slice(0, 3);
  const others = sortedLeaders.slice(3);



  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-hidden" style={{ height: "100vh" }}>
      {/* Animated Gradient Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(120deg, #0f172a 0%, #1e293b 40%, #6366f1 100%)",
          animation: "gradientMove 12s ease-in-out infinite alternate"
        }}
      />
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full pt-8">
        <h1 className="text-6xl font-extrabold text-center mb-4 bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-600 bg-clip-text text-transparent drop-shadow-lg tracking-tight"
            style={{ letterSpacing: ".04em", textShadow: "0 8px 60px #0ea5e9" }}>
           Leaderboard
        </h1>
        <Podium leaders={top3} />
        {others.length > 0 ? (
          <AutoRotatingGroupWaves users={others} />
        ) : (
          <div className="text-gray-400 font-semibold mt-8">No other users yet!</div>
        )}
      </div>
      <style>{`
        .animate-bounce { animation: bounce 1.8s infinite cubic-bezier(.5,1.8,.6,1.01); }
        .animate-spin-slow { animation: spin 5s linear infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-14px);}
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}