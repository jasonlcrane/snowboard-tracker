import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

interface Season {
    id: number;
    name: string;
    status: string;
}

interface SeasonContextType {
    selectedSeasonId: number | undefined;
    setSelectedSeasonId: (id: number | undefined) => void;
    seasons: Season[] | undefined;
    isLoading: boolean;
    currentSeason: Season | undefined;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
    const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>(() => {
        const saved = localStorage.getItem('selectedSeasonId');
        return saved ? Number(saved) : undefined;
    });

    const { data: seasons, isLoading } = trpc.badge.getAllSeasons.useQuery();

    useEffect(() => {
        if (selectedSeasonId) {
            localStorage.setItem('selectedSeasonId', selectedSeasonId.toString());
        } else {
            localStorage.removeItem('selectedSeasonId');
        }
    }, [selectedSeasonId]);

    const currentSeason = seasons?.find(s =>
        selectedSeasonId ? s.id === selectedSeasonId : s.status === 'active'
    ) || seasons?.[0];

    return (
        <SeasonContext.Provider value={{
            selectedSeasonId,
            setSelectedSeasonId,
            seasons,
            isLoading,
            currentSeason
        }}>
            {children}
        </SeasonContext.Provider>
    );
}

export function useSeason() {
    const context = useContext(SeasonContext);
    if (context === undefined) {
        throw new Error('useSeason must be used within a SeasonProvider');
    }
    return context;
}
