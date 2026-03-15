import { motion } from 'framer-motion';
import type { CardProps } from '../types';
import { formatRewindDate } from '../types';

export function OpenerCard({ data, isActive }: CardProps) {
    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

            {/* Floating snowflakes */}
            {isActive && Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-white/20 pointer-events-none select-none"
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                        y: -20,
                        opacity: 0
                    }}
                    animate={{
                        y: typeof window !== 'undefined' ? window.innerHeight + 20 : 820,
                        opacity: [0, 0.6, 0.6, 0],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 4 + Math.random() * 6,
                        delay: Math.random() * 3,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                    style={{ fontSize: 10 + Math.random() * 16 }}
                >
                    ❄
                </motion.div>
            ))}

            <div className="text-center z-10 px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <p className="text-white/50 text-sm tracking-[0.3em] uppercase mb-4 font-light">Your</p>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-5xl md:text-7xl font-bold text-white mb-2"
                    style={{ textShadow: '0 0 40px rgba(255,255,255,0.15)' }}
                >
                    Season Rewind
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <p className="text-white/40 text-lg mb-6 font-light">{data.season.name}</p>
                    <p className="text-white/30 text-sm">
                        {formatRewindDate(data.firstDay)} → {formatRewindDate(data.lastDay)}
                    </p>
                </motion.div>

                {/* App Logo with 3D spin effect */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                        opacity: { duration: 0.6, delay: 1.2 },
                        scale: { duration: 0.8, delay: 1.2, type: 'spring', bounce: 0.3 },
                    }}
                    className="mt-10"
                    style={{ perspective: 800 }}
                >
                    <motion.img
                        src="/logo.png"
                        alt="Season Rewind"
                        className="w-52 h-52 md:w-64 md:h-64 mx-auto"
                        style={{
                            filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.3))',
                        }}
                        animate={isActive ? {
                            rotateY: [0, 360],
                        } : { rotateY: 0 }}
                        transition={{
                            duration: 1.5,
                            delay: 1.8,
                            ease: [0.25, 0.1, 0.25, 1],
                        }}
                    />
                </motion.div>

                {/* Gentle floating after spin */}
                <motion.div
                    animate={isActive ? { y: [0, -8, 0] } : {}}
                    transition={{ duration: 3, delay: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>
        </div>
    );
}
