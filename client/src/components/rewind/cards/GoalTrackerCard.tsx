import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CardProps } from '../types';

function AnimatedPercentage({ value, isActive }: { value: number; isActive: boolean }) {
    const spring = useSpring(0, { duration: 1500 });
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

export function GoalTrackerCard({ data, isActive }: CardProps) {
    const { goalProgress } = data;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(goalProgress.percentage, 100) / 100;

    // Choose colors based on goal status
    const bgGradient = goalProgress.met
        ? 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)'
        : 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #f59e0b 100%)';

    const ringColor = goalProgress.met ? '#34d399' : '#fbbf24';
    const ringTrack = goalProgress.met ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)';

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: bgGradient }}>

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
                        {/* Track */}
                        <circle cx="110" cy="110" r={radius} fill="none" stroke={ringTrack} strokeWidth="12" />
                        {/* Progress */}
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
                    {/* Center text */}
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
