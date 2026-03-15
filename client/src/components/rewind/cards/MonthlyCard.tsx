import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CardProps } from '../types';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function AnimatedCount({ value, isActive, delay = 0.5 }: { value: number; isActive: boolean; delay?: number }) {
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => Math.round(v));
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        if (isActive) {
            motionVal.set(0);
            const controls = animate(motionVal, value, { duration: 1.2, delay, ease: 'easeOut' });
            return () => controls.stop();
        }
    }, [isActive, value, motionVal, delay]);

    useEffect(() => {
        return rounded.on('change', (v) => setDisplayVal(v));
    }, [rounded]);

    return <span>{displayVal}</span>;
}

export function MonthlyCard({ data, isActive }: CardProps) {
    const maxCount = Math.max(...data.monthlyBreakdown.map(m => m.count), 1);

    // Build heatmap from actual badge-in dates
    const dateSet = new Set(data.badgeInDates);
    const monthMap = new Map<string, string[]>();
    for (const dateStr of data.badgeInDates) {
        const key = dateStr.slice(0, 7); // "YYYY-MM"
        if (!monthMap.has(key)) monthMap.set(key, []);
        monthMap.get(key)!.push(dateStr);
    }

    const sortedMonthKeys = Array.from(monthMap.keys()).sort();
    const heatmapMonths = sortedMonthKeys.map(key => {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
            return { day, active: dateSet.has(dateStr) };
        });

        return { month: MONTH_NAMES[monthIndex], days };
    });

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #831843 0%, #e11d48 50%, #f43f5e 100%)' }}>

            {/* Fire cascade on busiest month */}
            {isActive && Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none select-none"
                    initial={{
                        x: (typeof window !== 'undefined' ? window.innerWidth / 2 : 400) + (Math.random() - 0.5) * 200,
                        y: typeof window !== 'undefined' ? window.innerHeight * 0.45 : 360,
                        opacity: 0,
                    }}
                    animate={{
                        y: typeof window !== 'undefined' ? window.innerHeight * 0.1 : 80,
                        opacity: [0, 0.5, 0],
                        scale: [0.5, 1, 0.3],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        delay: 1.5 + Math.random() * 3,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                    style={{ fontSize: 14 + Math.random() * 10 }}
                >
                    🔥
                </motion.div>
            ))}

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
                    className="text-rose-200/60 text-lg mb-8"
                >
                    with <span className="text-white font-bold text-2xl">
                        <AnimatedCount value={data.busiestMonth.count} isActive={isActive} delay={0.8} />
                    </span> hill {data.busiestMonth.count === 1 ? 'day' : 'days'}
                </motion.p>

                {/* Bar chart */}
                <div className="space-y-3 mb-8">
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
                                <div className="flex-1 h-7 bg-white/10 rounded-full overflow-hidden relative">
                                    <motion.div
                                        className={`h-full rounded-full ${isBusiest
                                            ? 'bg-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.4)]'
                                            : 'bg-white/20'}`}
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

                {/* Heatmap calendar */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 2.0 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-4"
                >
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Your season at a glance</p>
                    <div className="space-y-1.5">
                        {heatmapMonths.map((mg, mi) => (
                            <motion.div
                                key={`${mg.month}-${mi}`}
                                initial={{ opacity: 0 }}
                                animate={isActive ? { opacity: 1 } : {}}
                                transition={{ duration: 0.3, delay: 2.2 + mi * 0.1 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-white/30 text-[10px] w-7 text-right font-medium">{mg.month.slice(0, 3)}</span>
                                <div className="flex gap-[2px]">
                                    {mg.days.map((d) => (
                                        <div
                                            key={d.day}
                                            className={`w-[6px] h-[6px] rounded-[1px] transition-colors ${d.active
                                                ? 'bg-rose-400 shadow-[0_0_3px_rgba(251,113,133,0.5)]'
                                                : 'bg-white/8'
                                                }`}
                                            title={`${mg.month} ${d.day}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
