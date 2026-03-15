import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CardProps } from '../types';

function AnimatedPercentage({ value, isActive }: { value: number; isActive: boolean }) {
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => Math.round(v));
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        if (isActive) {
            motionVal.set(0);
            const controls = animate(motionVal, value, {
                duration: 1.5,
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

export function GoalTrackerCard({ data, isActive }: CardProps) {
    const { goalProgress } = data;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(goalProgress.percentage, 100) / 100;

    const bgGradient = goalProgress.met
        ? 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)'
        : 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #f59e0b 100%)';

    const ringColor = goalProgress.met ? '#34d399' : '#fbbf24';
    const ringTrack = goalProgress.met ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)';

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: bgGradient }}>

            {/* Fire burst when goal is met */}
            {isActive && goalProgress.met && Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none select-none"
                    initial={{
                        x: (typeof window !== 'undefined' ? window.innerWidth / 2 : 400) + (Math.random() - 0.5) * 180,
                        y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
                        opacity: 0,
                        scale: 0.5,
                    }}
                    animate={{
                        y: typeof window !== 'undefined' ? window.innerHeight * 0.15 : 120,
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 1.1, 0],
                    }}
                    transition={{
                        duration: 2.5 + Math.random() * 2,
                        delay: 2 + Math.random() * 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                    style={{ fontSize: 16 + Math.random() * 12 }}
                >
                    🔥
                </motion.div>
            ))}

            <div className="text-center z-10 px-8">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-8"
                >
                    {goalProgress.met ? 'You crushed your goal!' : 'Goal Progress'}
                </motion.p>

                {/* Progress ring */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="relative inline-block mb-8"
                >
                    <svg width="220" height="220" viewBox="0 0 220 220">
                        <circle cx="110" cy="110" r={radius} fill="none" stroke={ringTrack} strokeWidth="12" />
                        <motion.circle
                            cx="110" cy="110" r={radius}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            transform="rotate(-90 110 110)"
                            initial={{ strokeDashoffset: circumference }}
                            animate={isActive ? { strokeDashoffset: circumference * (1 - pct) } : { strokeDashoffset: circumference }}
                            transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-white">
                            <AnimatedPercentage value={goalProgress.percentage} isActive={isActive} />
                            <span className="text-2xl font-light">%</span>
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 1.5 }}
                >
                    {goalProgress.met ? (
                        <div>
                            <p className="text-white/80 text-xl font-light mb-2">
                                <span className="font-bold text-white">{goalProgress.current}</span> days —
                                exceeding your goal of {goalProgress.goal}!
                            </p>
                            <motion.p
                                initial={{ opacity: 0, scale: 0 }}
                                animate={isActive ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 2.0, type: 'spring' }}
                                className="text-5xl mt-4"
                            >
                                🏆
                            </motion.p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-white/80 text-xl font-light mb-2">
                                <span className="font-bold text-white">{goalProgress.current}</span> of{' '}
                                <span className="font-bold text-white">{goalProgress.goal}</span> days
                            </p>
                            <p className="text-white/50 text-sm">
                                {goalProgress.goal - goalProgress.current} more {goalProgress.goal - goalProgress.current === 1 ? 'day' : 'days'} to go!
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
