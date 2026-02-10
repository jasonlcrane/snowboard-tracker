import { ChevronDown, History } from 'lucide-react';
import { useSeason } from '@/contexts/SeasonContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function SeasonSwitcher() {
    const { seasons, currentSeason, setSelectedSeasonId, isLoading } = useSeason();

    if (isLoading || !currentSeason) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group flex items-baseline gap-2">
                    <h1 className="text-3xl font-black tracking-tighter transition-colors group-hover:text-accent">
                        {currentSeason.name}
                    </h1>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground py-2">
                    Switch Season
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                {seasons?.map((season) => (
                    <DropdownMenuItem
                        key={season.id}
                        onClick={() => setSelectedSeasonId(season.id)}
                        className="flex items-center justify-between py-3 cursor-pointer focus:bg-accent/10"
                    >
                        <div className="flex items-center gap-3">
                            <History className={`w-4 h-4 ${season.id === currentSeason.id ? 'text-accent' : 'text-muted-foreground'}`} />
                            <span className={`font-medium ${season.id === currentSeason.id ? 'text-accent' : 'text-foreground'}`}>
                                {season.name}
                            </span>
                        </div>
                        {season.status === 'active' && (
                            <Badge variant="secondary" className="bg-accent/10 border-accent/20 text-accent text-[9px] py-0 px-1.5 uppercase tracking-tighter">
                                Active
                            </Badge>
                        )}
                        {season.status === 'completed' && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase tracking-tighter border-muted-foreground/30 text-muted-foreground">
                                Archived
                            </Badge>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
