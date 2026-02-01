import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Loader2 } from 'lucide-react';

export function ForecastWidget() {
    const { data: forecast, isLoading } = trpc.weather.getForecast.useQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 bg-card/10 rounded-xl border border-border/20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!forecast || forecast.length === 0) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const displayForecast = forecast.filter(d => d.date >= todayStr).slice(0, 7);

    if (displayForecast.length === 0) return null;

    return (
        <div className="flex overflow-x-auto pb-2 gap-2 snap-x scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {displayForecast.map((day) => {
                const [year, month, d] = day.date.split('-').map(Number);
                const localDate = new Date(year, month - 1, d);
                const isToday = day.date === todayStr;

                return (
                    <Card
                        key={day.date}
                        className={`min-w-[90px] flex-1 snap-start bg-card/30 border-border/50 backdrop-blur-sm transition-colors ${isToday ? 'border-accent/50 bg-accent/5' : ''}`}
                    >
                        <CardContent className="p-3 flex flex-col items-center text-center space-y-1">
                            <span className={`text-[10px] uppercase tracking-wider font-bold ${isToday ? 'text-accent' : 'text-muted-foreground'}`}>
                                {isToday ? 'Today' : localDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <WeatherIcon condition={day.conditions} />
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-bold">{Math.round(day.tempHigh)}°</span>
                                <span className="text-[10px] text-muted-foreground">{Math.round(day.tempLow)}°</span>
                            </div>
                            {day.snowProbability > 0 && (
                                <div className="flex items-center gap-0.5 text-[9px] font-bold text-accent whitespace-nowrap">
                                    <CloudSnow className="w-2.5 h-2.5" />
                                    {day.snowProbability}%
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function WeatherIcon({ condition }: { condition: string }) {
    const c = condition.toLowerCase();
    const iconClass = "w-6 h-6";
    if (c.includes('snow')) return <CloudSnow className={iconClass + " text-blue-300"} />;
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className={iconClass + " text-blue-400"} />;
    if (c.includes('thunderstorm')) return <CloudLightning className={iconClass + " text-yellow-500"} />;
    if (c.includes('clear')) return <Sun className={iconClass + " text-orange-400"} />;
    return <Cloud className={iconClass + " text-gray-400"} />;
}
