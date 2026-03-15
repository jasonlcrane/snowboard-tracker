import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CardProps } from '../types';
import { formatRewindDateShort } from '../types';

function AnimatedNumber({ value, isActive }: { value: number; isActive: boolean }) {
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => Math.round(v));
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        if (isActive) {
            motionVal.set(0);
            const controls = animate(motionVal, value, {
                duration: 1.2,
                ease: 'easeOut',
            });
            return () => controls.stop();
        }
    }, [isActive, value, motionVal]);

    useEffect(() => {
        return rounded.on('change', (v) => setDisplayVal(v));
    }, [rounded]);

    return <span>{displayVal}</span>;
}

export function StreakCard({ data, isActive }: CardProps) {
    const streak = data.longestStreak;
    const hasStreak = streak.days > 0;

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #d97706 100%)' }}>

            {/* Flame particles */}
            {isActive && hasStreak && Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none"
                    initial={{
                        x: (typeof window !== 'undefined' ? window.innerWidth / 2 : 400) + (Math.random() - 0.5) * 200,
                        y: typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500,
                        opacity: 0,
                        scale: 0.5,
                    }}
                    animate={{
                        y: -50,
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.2, 0],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                    style={{ fontSize: 20 + Math.random() * 20 }}
                >
                    🔥
                </motion.div>
            ))}

            <div className="text-center z-10 px-8">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-6"
                >
                    {hasStreak ? 'Your longest run' : 'Keep Building That Streak'}
                </motion.p>

                {hasStreak ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={isActive ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.3 }}
                            className="mb-4"
                        >
                            <span className="text-[100px] md:text-[140px] font-black text-white leading-none"
                                style={{ textShadow: '0 0 60px rgba(234,88,12,0.5)' }}>
                                <AnimatedNumber value={streak.days} isActive={isActive} />
                            </span>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isActive ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            className="text-white/80 text-2xl font-light mb-8"
                        >
                            {streak.days === 1 ? 'day' : 'days'} in a row
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isActive ? { opacity: 1 } : {}}
                            transition={{ duration: 0.6, delay: 1.4 }}
                            className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm inline-block"
                        >
                            <p className="text-white/60 text-sm">
                                {formatRewindDateShort(streak.startDate)} → {formatRewindDateShort(streak.endDate)}
                            </p>
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <p className="text-white/60 text-xl">Ride every day to build a streak!</p>
                        <p className="text-6xl mt-6">❄️</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
