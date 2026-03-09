import { motion } from 'framer-motion';
import type { CardProps } from '../types';
import { formatRewindDate } from '../types';

export function PowderDayCard({ data, isActive }: CardProps) {
    const powder = data.bestPowderDay;

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)' }}>

            {/* Snow particles */}
            {isActive && Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none select-none"
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                        y: -10,
                        opacity: 0,
                    }}
                    animate={{
                        y: typeof window !== 'undefined' ? window.innerHeight + 10 : 810,
                        x: `+=${(Math.random() - 0.5) * 100}`,
                        opacity: [0, 0.8, 0.8, 0],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 4,
                        delay: Math.random() * 2,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                </motion.div>
            ))}

            <div className="text-center z-10 px-8">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-slate-600/70 text-lg tracking-wider uppercase mb-6"
                >
                    Best powder day
                </motion.p>

                {powder ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={isActive ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
                            className="mb-4"
                        >
                            <span className="text-[90px] md:text-[130px] font-black text-slate-800 leading-none">
                                {powder.snowfall}
                            </span>
                            <span className="text-3xl text-slate-500 font-light ml-2">inches</span>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isActive ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            className="text-slate-600 text-xl font-light mb-8"
                        >
                            on {formatRewindDate(powder.date)}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isActive ? { opacity: 1 } : {}}
                            transition={{ duration: 0.6, delay: 1.4 }}
                            className="px-6 py-3 rounded-2xl bg-slate-800/10 backdrop-blur-sm inline-block"
                        >
                            <p className="text-slate-600 text-sm">
                                Total snowfall on your hill days: <span className="text-slate-800 font-semibold">{data.totalSnowfallOnHillDays}" </span>
                            </p>
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <p className="text-6xl mb-4">🌨️</p>
                        <p className="text-slate-600 text-xl">No snowfall data yet</p>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1.8 }}
                    className="text-6xl mt-8"
                >
                    🌨️
                </motion.div>
            </div>
        </div>
    );
}
