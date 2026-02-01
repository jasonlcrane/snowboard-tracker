import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Loader2 } from 'lucide-react';

export function ForecastWidget() {
    const { data: forecast, isLoading } = trpc.weather.getForecast.useQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!forecast || forecast.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {forecast.map((day) => (
                <Card key={day.date} className="bg-card/30 border-border/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <WeatherIcon condition={day.conditions} />
                        <div className="flex flex-col">
                            <span className="text-lg font-bold">{Math.round(day.tempHigh)}°</span>
                            <span className="text-xs text-muted-foreground">{Math.round(day.tempLow)}°</span>
                        </div>
                        {day.snowProbability > 0 && (
                            <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 bg-accent/10 rounded-full">
                                {day.snowProbability}% Snow
                            </span>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function WeatherIcon({ condition }: { condition: string }) {
    const c = condition.toLowerCase();
    if (c.includes('snow')) return <CloudSnow className="w-8 h-8 text-blue-300" />;
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (c.includes('thunderstorm')) return <CloudLightning className="w-8 h-8 text-yellow-500" />;
    if (c.includes('clear')) return <Sun className="w-8 h-8 text-orange-400" />;
    return <Cloud className="w-8 h-8 text-gray-400" />;
}
