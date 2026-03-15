import { motion } from 'framer-motion';
import { useState } from 'react';
import type { CardProps } from '../types';
import type { RewindData } from '../types';
import { downloadShareImage } from '../ShareRenderer';

function getRiderTitle(data: RewindData): string {
    const totalDays = data.totalDays;
    const streakDays = data.longestStreak.days;
    const coldestTemp = data.coldestDay?.tempLow ?? 50;
    const powderSnow = data.bestPowderDay?.snowfall ?? 0;
    const goalMet = data.goalProgress.met;

    if (goalMet) return 'Goal Crusher';

    const dayScore = totalDays >= 40 ? 3 : totalDays >= 25 ? 2 : totalDays >= 15 ? 1 : 0;
    const streakScore = streakDays >= 4 ? 3 : streakDays >= 3 ? 2 : streakDays >= 2 ? 1 : 0;
    const coldScore = coldestTemp <= 0 ? 3 : coldestTemp <= 10 ? 2 : coldestTemp <= 20 ? 1 : 0;
    const powderScore = powderSnow >= 6 ? 3 : powderSnow >= 3 ? 2 : powderSnow >= 1 ? 1 : 0;

    const traits = [
        { score: dayScore, title: 'Hill Addict' },
        { score: streakScore, title: 'Streak Master' },
        { score: coldScore, title: 'Ice Rider' },
        { score: powderScore, title: 'Powder Hound' },
    ];

    const dominant = traits.sort((a, b) => b.score - a.score)[0];
    if (dominant.score === 0) return 'Rising Rider';
    return dominant.title;
}

export function SummaryCard({ data, isActive }: CardProps) {
    const riderTitle = getRiderTitle(data);
    const [isSharing, setIsSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState<string | null>(null);

    const handleShareImage = async () => {
        setIsSharing(true);
        setShareStatus(null);
        try {
            await downloadShareImage(data);
            setShareStatus('Image saved!');
        } catch (err) {
            console.error('Share failed:', err);
            setShareStatus('Failed — try again');
        } finally {
            setIsSharing(false);
            setTimeout(() => setShareStatus(null), 3000);
        }
    };

    const handleCopyText = async () => {
        const text = `🏂 My Season Rewind: ${data.season.name}\n\n` +
            `${riderTitle}\n` +
            `🗓️ ${data.totalDays} hill days\n` +
            `🏔️ Favorite: ${data.favoriteHill.hill}\n` +
            `🔥 ${data.longestStreak.days}-day streak\n` +
            `\nSee you next season! ❄️`;

        try {
            await navigator.clipboard.writeText(text);
            setShareStatus('Copied to clipboard!');
        } catch {
            setShareStatus('Could not copy');
        }
        setTimeout(() => setShareStatus(null), 3000);
    };

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 30%, #1e3a5f 70%, #0f172a 100%)' }}>

            {/* Sparkle particles */}
            {isActive && Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none select-none text-yellow-300/40"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 1.5 + Math.random() * 2,
                        delay: Math.random() * 4,
                        repeat: Infinity,
                    }}
                    style={{
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                        fontSize: 12 + Math.random() * 16,
                    }}
                >
                    ✦
                </motion.div>
            ))}

            <div className="text-center z-10 px-6 w-full max-w-md">
                {/* App logo */}
                <motion.img
                    src="/logo.png"
                    alt=""
                    initial={{ opacity: 0, rotateY: 0 }}
                    animate={isActive ? { opacity: 1, rotateY: 360 } : {}}
                    transition={{
                        opacity: { duration: 0.5, delay: 0.3 },
                        rotateY: { duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] },
                    }}
                    className="w-28 h-28 mx-auto mb-4"
                    style={{
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.25))',
                        perspective: 800,
                    }}
                />

                {/* Rider Title */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 1.0, delay: 0.8, type: 'spring', bounce: 0.3 }}
                    className="mb-8"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-2"
                        style={{ textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>
                        {riderTitle}
                    </h2>
                    <p className="text-white/30 text-sm tracking-[0.2em] uppercase">{data.season.name}</p>
                </motion.div>

                {/* 3 key stats in a row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="flex justify-center gap-6 mb-12"
                >
                    {[
                        { value: `${data.totalDays}`, label: 'Days', icon: '🗓️' },
                        { value: `${data.longestStreak.days}`, label: 'Day Streak', icon: '🔥' },
                        { value: data.favoriteHill.hill, label: 'Top Hill', icon: '🏔️' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={isActive ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 1.6 + i * 0.15 }}
                            className="flex-1 text-center"
                        >
                            <p className="text-lg mb-1">{stat.icon}</p>
                            <p className="text-white font-bold text-lg truncate">{stat.value}</p>
                            <p className="text-white/35 text-xs">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Share buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 2.2 }}
                    className="flex flex-col items-center gap-3 mb-8"
                >
                    <button
                        onClick={handleShareImage}
                        disabled={isSharing}
                        className="px-8 py-3 bg-amber-500/20 hover:bg-amber-500/30 rounded-full text-white font-medium transition-all backdrop-blur-sm border border-amber-400/20 hover:border-amber-400/30 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSharing ? (
                            <>
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="inline-block"
                                >
                                    ⏳
                                </motion.span>
                                Rendering...
                            </>
                        ) : (
                            '📸 Share as Image'
                        )}
                    </button>

                    <button
                        onClick={handleCopyText}
                        className="px-6 py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                        📋 Copy Stats as Text
                    </button>

                    {shareStatus && (
                        <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-amber-200/70 text-sm"
                        >
                            {shareStatus}
                        </motion.p>
                    )}
                </motion.div>

                {/* Sign-off */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 2.6 }}
                    className="text-white/25 text-sm"
                >
                    See you next season! ❄️
                </motion.p>
            </div>
        </div>
    );
}
