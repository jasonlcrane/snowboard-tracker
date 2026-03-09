import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CardProps } from '../types';
import { formatRewindDate } from '../types';
import { downloadShareImage } from '../ShareRenderer';

function AnimatedScore({ value, isActive }: { value: number; isActive: boolean }) {
    const spring = useSpring(0, { duration: 2000 });
    const display = useTransform(spring, (v) => Math.round(v));
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        if (isActive) spring.set(value);
    }, [isActive, value, spring]);

    useEffect(() => {
        return display.on('change', (v) => setDisplayVal(v));
    }, [display]);

    return <span>{displayVal}</span>;
}

function getScoreLabel(score: number): string {
    if (score >= 90) return 'Legendary Season';
    if (score >= 75) return 'Epic Season';
    if (score >= 60) return 'Solid Season';
    if (score >= 40) return 'Getting There';
    return 'Just Getting Started';
}

function getScoreEmoji(score: number): string {
    if (score >= 90) return '🏆';
    if (score >= 75) return '⭐';
    if (score >= 60) return '🎿';
    if (score >= 40) return '💪';
    return '🌱';
}

export function SummaryCard({ data, isActive }: CardProps) {
    const scoreLabel = getScoreLabel(data.seasonScore);
    const scoreEmoji = getScoreEmoji(data.seasonScore);
    const [isSharing, setIsSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState<string | null>(null);

    const highlights = [
        { label: 'Hill Days', value: `${data.totalDays}`, icon: '🎿' },
        { label: 'Favorite Hill', value: data.favoriteHill.hill, icon: '🏔️' },
        { label: 'Best Streak', value: `${data.longestStreak.weeks} weeks`, icon: '🔥' },
        ...(data.coldestDay ? [{ label: 'Coldest Ride', value: `${data.coldestDay.tempLow}°F`, icon: '🥶' }] : []),
        ...(data.bestPowderDay ? [{ label: 'Best Powder', value: `${data.bestPowderDay.snowfall}"`, icon: '🌨️' }] : []),
        { label: 'Favorite Day', value: data.favoriteDayOfWeek.day, icon: '📅' },
    ];

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
        const text = `🎿 My Season Rewind: ${data.season.name}\n\n` +
            `📊 Season Score: ${data.seasonScore}/100 — ${scoreLabel}\n` +
            `🎿 ${data.totalDays} hill days\n` +
            `🏔️ Favorite: ${data.favoriteHill.hill}\n` +
            `🔥 ${data.longestStreak.weeks}-week streak\n` +
            (data.coldestDay ? `🥶 Coldest: ${data.coldestDay.tempLow}°F\n` : '') +
            (data.bestPowderDay ? `🌨️ Best powder: ${data.bestPowderDay.snowfall}"\n` : '') +
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
            {isActive && Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none select-none text-yellow-300/60"
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
                {/* Season Score */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 1.0, delay: 0.3, type: 'spring', bounce: 0.3 }}
                    className="mb-6"
                >
                    <p className="text-white/40 text-sm tracking-[0.3em] uppercase mb-2">Season Score</p>
                    <div className="text-[80px] md:text-[100px] font-black text-white leading-none"
                        style={{ textShadow: '0 0 60px rgba(251,191,36,0.4)' }}>
                        <AnimatedScore value={data.seasonScore} isActive={isActive} />
                    </div>
                    <p className="text-amber-200/80 text-lg font-light mt-1">{scoreEmoji} {scoreLabel}</p>
                </motion.div>

                {/* Highlight grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="grid grid-cols-2 gap-2 mb-6"
                >
                    {highlights.map((h, i) => (
                        <motion.div
                            key={h.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={isActive ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 1.4 + i * 0.1 }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 text-left"
                        >
                            <p className="text-lg mb-0.5">{h.icon}</p>
                            <p className="text-white font-bold text-sm truncate">{h.value}</p>
                            <p className="text-white/40 text-xs">{h.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Date range */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 2.0 }}
                    className="text-white/30 text-sm mb-6"
                >
                    {formatRewindDate(data.firstDay)} → {formatRewindDate(data.lastDay)}
                </motion.p>

                {/* Share buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 2.3 }}
                    className="flex flex-col items-center gap-3"
                >
                    {/* Primary: Share as Image */}
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

                    {/* Secondary: Copy text */}
                    <button
                        onClick={handleCopyText}
                        className="px-6 py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                        📋 Copy Stats as Text
                    </button>

                    {/* Status message */}
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
                    transition={{ duration: 0.8, delay: 2.8 }}
                    className="mt-6 text-white/30 text-sm"
                >
                    See you next season! ❄️
                </motion.p>
            </div>
        </div>
    );
}
