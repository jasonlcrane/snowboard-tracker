import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CardProps } from '../types';

function AnimatedNumber({ value, isActive }: { value: number; isActive: boolean }) {
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, (v) => Math.round(v));
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        if (isActive) {
            // Always start from 0 and count up
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

export function TotalDaysCard({ data, isActive }: CardProps) {
    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a1a6e 0%, #4338ca 50%, #3730a3 100%)' }}>

            <div className="text-center z-10 px-8">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-8"
                >
                    You hit the slopes
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.3 }}
                    className="mb-6"
                >
                    <span className="text-[120px] md:text-[180px] font-black text-white leading-none"
                        style={{ textShadow: '0 0 80px rgba(139,92,246,0.5)' }}>
                        <AnimatedNumber value={data.totalDays} isActive={isActive} />
                    </span>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="text-white/80 text-2xl font-light"
                >
                    {data.totalDays === 1 ? 'time' : 'times'} this season!
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isActive ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 1.5 }}
                    className="mt-8 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm inline-block"
                >
                    <p className="text-white/60 text-sm">
                        That's <span className="text-white font-semibold">{data.avgDaysPerWeek}</span> days per week on average
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
