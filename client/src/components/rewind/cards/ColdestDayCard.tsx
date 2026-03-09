import { motion } from 'framer-motion';
import type { CardProps } from '../types';
import { formatRewindDate } from '../types';

export function ColdestDayCard({ data, isActive }: CardProps) {
    const coldest = data.coldestDay;

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #64748b 50%, #94a3b8 100%)' }}>

            {/* Frost crystals */}
            {isActive && Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-white/10 pointer-events-none select-none"
                    initial={{ opacity: 0, scale: 0, rotate: 0 }}
                    animate={{
                        opacity: [0, 0.3, 0],
                        scale: [0, 1.5, 0],
                        rotate: [0, 180],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 3,
                        delay: Math.random() * 4,
                        repeat: Infinity,
                    }}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        fontSize: 30 + Math.random() * 40,
                    }}
                >
                    ❄
                </motion.div>
            ))}

            <div className="text-center z-10 px-8">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-white/50 text-lg tracking-wider uppercase mb-6"
                >
                    Bravest ride
                </motion.p>

                {coldest ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={isActive ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
                            className="mb-4"
                        >
                            <span className="text-[100px] md:text-[140px] font-black text-white leading-none"
                                style={{ textShadow: '0 0 60px rgba(148,163,184,0.5)' }}>
                                {coldest.tempLow}°
                            </span>
                            <span className="text-4xl text-white/60 font-light">F</span>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isActive ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            className="text-white/70 text-xl font-light mb-8"
                        >
                            on {formatRewindDate(coldest.date)}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isActive ? { opacity: 1 } : {}}
                            transition={{ duration: 0.6, delay: 1.4 }}
                            className="flex flex-col gap-3 items-center"
                        >
                            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm inline-block">
                                <p className="text-white/60 text-sm">
                                    Your temperature sweet spot: <span className="text-white font-semibold">{data.tempSweetSpot}</span>
                                </p>
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <p className="text-6xl mb-4">🌡️</p>
                        <p className="text-white/60 text-xl">No temperature data yet</p>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1.8 }}
                    className="text-6xl mt-8"
                >
                    🥶
                </motion.div>
            </div>
        </div>
    );
}
