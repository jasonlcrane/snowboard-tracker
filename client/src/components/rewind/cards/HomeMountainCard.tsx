import { motion } from 'framer-motion';
import type { CardProps } from '../types';

export function HomeMountainCard({ data, isActive }: CardProps) {
    const total = data.hillBreakdown.reduce((s, h) => s + h.count, 0);
    const onlyOneHill = data.hillBreakdown.length === 1;

    // Generate colors for the donut chart
    const colors = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c'];

    // SVG donut chart
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #047857 100%)' }}>

            <div className="text-center z-10 px-8 max-w-lg">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-6"
                >
                    {onlyOneHill ? "You're a loyal local" : 'Your favorite hill was'}
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-2"
                    style={{ textShadow: '0 0 40px rgba(52,211,153,0.4)' }}
                >
                    {data.favoriteHill.hill}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-emerald-200/60 text-lg mb-10"
                >
                    {onlyOneHill
                        ? `All ${data.favoriteHill.count} days at one hill`
                        : `${data.favoriteHill.count} of ${total} visits`}
                </motion.p>

                {/* Donut chart */}
                {!onlyOneHill && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8, delay: 1.0 }}
                        className="flex flex-col items-center"
                    >
                        <svg width="200" height="200" viewBox="0 0 200 200" className="mb-6">
                            {data.hillBreakdown.map((hill, i) => {
                                const pct = hill.count / total;
                                const dashLen = pct * circumference;
                                const currentOffset = offset;
                                offset += dashLen;

                                return (
                                    <motion.circle
                                        key={hill.hill}
                                        cx="100" cy="100" r={radius}
                                        fill="none"
                                        stroke={colors[i % colors.length]}
                                        strokeWidth="20"
                                        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                                        strokeDashoffset={-currentOffset}
                                        strokeLinecap="round"
                                        transform="rotate(-90 100 100)"
                                        initial={{ opacity: 0 }}
                                        animate={isActive ? { opacity: 1 } : {}}
                                        transition={{ duration: 0.5, delay: 1.2 + i * 0.15 }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {data.hillBreakdown.map((hill, i) => (
                                <motion.div
                                    key={hill.hill}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={isActive ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 1.5 + i * 0.1 }}
                                    className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5"
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                    <span className="text-white/80 text-sm">{hill.hill} ({hill.count})</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {onlyOneHill && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8, delay: 1.0, type: 'spring' }}
                        className="text-8xl mt-4"
                    >
                        🏔️
                    </motion.div>
                )}
            </div>
        </div>
    );
}
