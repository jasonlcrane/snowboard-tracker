import { motion } from 'framer-motion';
import type { CardProps } from '../types';

export function DayOfWeekCard({ data, isActive }: CardProps) {
    const maxCount = Math.max(...data.dayOfWeekBreakdown.map(d => d.count), 1);

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #6d28d9 100%)' }}>

            <div className="text-center z-10 px-8 w-full max-w-md">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-6"
                >
                    You ride hardest on
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-10"
                    style={{ textShadow: '0 0 40px rgba(124,58,237,0.5)' }}
                >
                    {data.favoriteDayOfWeek.day}s
                </motion.h2>

                {/* Bar chart */}
                <div className="space-y-3">
                    {data.dayOfWeekBreakdown.map((item, i) => {
                        const pct = (item.count / maxCount) * 100;
                        const isFavorite = item.day === data.favoriteDayOfWeek.day;

                        return (
                            <motion.div
                                key={item.day}
                                initial={{ opacity: 0, x: -30 }}
                                animate={isActive ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.8 + i * 0.08 }}
                                className="flex items-center gap-3"
                            >
                                <span className={`text-sm w-8 text-right ${isFavorite ? 'text-white font-bold' : 'text-white/50'}`}>
                                    {item.day.slice(0, 3)}
                                </span>
                                <div className="flex-1 h-7 bg-white/10 rounded-full overflow-hidden relative">
                                    <motion.div
                                        className={`h-full rounded-full ${isFavorite ? 'bg-violet-300' : 'bg-white/20'}`}
                                        initial={{ width: 0 }}
                                        animate={isActive ? { width: `${Math.max(pct, 4)}%` } : { width: 0 }}
                                        transition={{ duration: 0.8, delay: 1.0 + i * 0.08, ease: 'easeOut' }}
                                    />
                                    {item.count > 0 && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={isActive ? { opacity: 1 } : {}}
                                            transition={{ duration: 0.3, delay: 1.6 + i * 0.05 }}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${isFavorite ? 'text-violet-900' : 'text-white/60'
                                                }`}
                                        >
                                            {item.count}
                                        </motion.span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Runner-up */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 2.0 }}
                    className="mt-8 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm inline-block"
                >
                    {(() => {
                        const sorted = [...data.dayOfWeekBreakdown].sort((a, b) => b.count - a.count);
                        const runner = sorted[1];
                        if (!runner || runner.count === 0) return null;
                        return (
                            <p className="text-white/60 text-sm">
                                {runner.day}s came in second with <span className="text-white font-semibold">{runner.count}</span> visits
                            </p>
                        );
                    })()}
                </motion.div>
            </div>
        </div>
    );
}
