import { useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Share2, Download, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { OpenerCard } from '@/components/rewind/cards/OpenerCard';
import { TotalDaysCard } from '@/components/rewind/cards/TotalDaysCard';
import { HomeMountainCard } from '@/components/rewind/cards/HomeMountainCard';
import { StreakCard } from '@/components/rewind/cards/StreakCard';
import { ColdestDayCard } from '@/components/rewind/cards/ColdestDayCard';
import { PowderDayCard } from '@/components/rewind/cards/PowderDayCard';
import { DayOfWeekCard } from '@/components/rewind/cards/DayOfWeekCard';
import { GoalTrackerCard } from '@/components/rewind/cards/GoalTrackerCard';
import { MonthlyCard } from '@/components/rewind/cards/MonthlyCard';
import { SummaryCard } from '@/components/rewind/cards/SummaryCard';

const CARD_COUNT = 10;

export default function SeasonRewind() {
    const [, navigate] = useLocation();
    const { data, isLoading, error } = trpc.rewind.getSeasonRewind.useQuery();
    const [activeCard, setActiveCard] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);

    // Scroll to card by index
    const scrollToCard = useCallback((index: number) => {
        const container = containerRef.current;
        if (!container) return;
        const cards = container.querySelectorAll<HTMLElement>('.rewind-card');
        if (cards[index]) {
            isScrolling.current = true;
            cards[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveCard(index);
            setTimeout(() => { isScrolling.current = false; }, 800);
        }
    }, []);

    // Intersection observer to track active card
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !data) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (isScrolling.current) return;
                for (const entry of entries) {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        if (!isNaN(index)) setActiveCard(index);
                    }
                }
            },
            { root: container, threshold: 0.5 }
        );

        const cards = container.querySelectorAll('.rewind-card');
        cards.forEach(card => observer.observe(card));

        return () => observer.disconnect();
    }, [data]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                scrollToCard(Math.min(activeCard + 1, CARD_COUNT - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                scrollToCard(Math.max(activeCard - 1, 0));
            } else if (e.key === 'Escape') {
                navigate('/');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeCard, scrollToCard, navigate]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-white"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="text-6xl mb-4 inline-block"
                    >
                        🎿
                    </motion.div>
                    <p className="text-xl font-light tracking-wider">Loading your Season Rewind...</p>
                </motion.div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
                <div className="text-center text-white px-8">
                    <p className="text-6xl mb-4">❄️</p>
                    <h2 className="text-2xl font-bold mb-2">No Season Data Yet</h2>
                    <p className="text-white/60 mb-6">Hit the slopes a few times and come back for your Rewind!</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-4 left-4 z-[60] p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all"
                title="Back to Dashboard"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Progress dots */}
            <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-2">
                {Array.from({ length: CARD_COUNT }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollToCard(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === activeCard
                                ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                        title={`Card ${i + 1}`}
                    />
                ))}
            </div>

            {/* Scroll hint */}
            <AnimatePresence>
                {activeCard === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] text-white/50"
                    >
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex flex-col items-center gap-1"
                        >
                            <span className="text-xs tracking-widest uppercase">Scroll to begin</span>
                            <ChevronDown className="w-5 h-5" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card navigation arrows */}
            {activeCard > 0 && (
                <button
                    onClick={() => scrollToCard(activeCard - 1)}
                    className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
            )}
            {activeCard < CARD_COUNT - 1 && (
                <button
                    onClick={() => scrollToCard(activeCard + 1)}
                    className="fixed bottom-4 right-4 z-[60] p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            )}

            {/* Card deck */}
            <div
                ref={containerRef}
                className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: 'none' }}
            >
                <div className="rewind-card snap-start" data-index="0"><OpenerCard data={data} isActive={activeCard === 0} /></div>
                <div className="rewind-card snap-start" data-index="1"><TotalDaysCard data={data} isActive={activeCard === 1} /></div>
                <div className="rewind-card snap-start" data-index="2"><HomeMountainCard data={data} isActive={activeCard === 2} /></div>
                <div className="rewind-card snap-start" data-index="3"><StreakCard data={data} isActive={activeCard === 3} /></div>
                <div className="rewind-card snap-start" data-index="4"><ColdestDayCard data={data} isActive={activeCard === 4} /></div>
                <div className="rewind-card snap-start" data-index="5"><PowderDayCard data={data} isActive={activeCard === 5} /></div>
                <div className="rewind-card snap-start" data-index="6"><DayOfWeekCard data={data} isActive={activeCard === 6} /></div>
                <div className="rewind-card snap-start" data-index="7"><GoalTrackerCard data={data} isActive={activeCard === 7} /></div>
                <div className="rewind-card snap-start" data-index="8"><MonthlyCard data={data} isActive={activeCard === 8} /></div>
                <div className="rewind-card snap-start" data-index="9"><SummaryCard data={data} isActive={activeCard === 9} /></div>
            </div>
        </div>
    );
}
