import { motion } from 'framer-motion';
import type { CardProps } from '../types';

export function MonthlyCard({ data, isActive }: CardProps) {
    const maxCount = Math.max(...data.monthlyBreakdown.map(m => m.count), 1);

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #831843 0%, #e11d48 50%, #f43f5e 100%)' }}>

            <div className="text-center z-10 px-8 w-full max-w-lg">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-4"
                >
                    Your busiest month was
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-2"
                    style={{ textShadow: '0 0 40px rgba(225,29,72,0.5)' }}
                >
                    {data.busiestMonth.month}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-rose-200/60 text-lg mb-10"
                >
                    with {data.busiestMonth.count} hill {data.busiestMonth.count === 1 ? 'day' : 'days'}
                </motion.p>

                {/* Horizontal bar chart */}
                <div className="space-y-4">
                    {data.monthlyBreakdown.map((item, i) => {
                        const pct = (item.count / maxCount) * 100;
                        const isBusiest = item.month === data.busiestMonth.month;

                        return (
                            <motion.div
                                key={item.month}
                                initial={{ opacity: 0, x: -30 }}
                                animate={isActive ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <span className={`text-sm w-12 text-right font-medium ${isBusiest ? 'text-white' : 'text-white/50'
                                    }`}>
                                    {item.month.slice(0, 3)}
                                </span>
                                <div className="flex-1 h-8 bg-white/10 rounded-full overflow-hidden relative">
                                    <motion.div
                                        className={`h-full rounded-full ${isBusiest ? 'bg-rose-300' : 'bg-white/20'}`}
                                        initial={{ width: 0 }}
                                        animate={isActive ? { width: `${Math.max(pct, 6)}%` } : { width: 0 }}
                                        transition={{ duration: 0.8, delay: 1.2 + i * 0.1, ease: 'easeOut' }}
                                    />
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={isActive ? { opacity: 1 } : {}}
                                        transition={{ duration: 0.3, delay: 1.8 + i * 0.05 }}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold ${isBusiest ? 'text-rose-900' : 'text-white/60'
                                            }`}
                                    >
                                        {item.count}
                                    </motion.span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
