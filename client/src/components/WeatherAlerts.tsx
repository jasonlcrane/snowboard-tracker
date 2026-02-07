import { trpc } from '@/lib/trpc';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CloudSnow, ThermometerSnowflake, Waves, AlertTriangle, Snowflake } from 'lucide-react';

export function WeatherAlerts() {
    const { data: forecast } = trpc.weather.getForecast.useQuery();

    if (!forecast || forecast.length === 0) return null;

    const today = new Date();
    const isMarchOrLater = today.getMonth() >= 2; // 0-indexed, 2 is March

    // Logic for alerts
    const warmDays = forecast.filter(d => d.tempHigh > 45).length;
    const closingWatch = isMarchOrLater && warmDays >= 3;

    const powderDays = forecast.filter(d =>
        (d.snowProbability > 50 || d.conditions.toLowerCase().includes('snow')) &&
        new Date(d.date).getTime() <= today.getTime() + (48 * 60 * 60 * 1000)
    );
    const powderAlert = powderDays.length > 0;

    const heroSnowDays = forecast.filter(d => d.tempLow < 28 && d.tempHigh > 40);
    const heroSnowAlert = heroSnowDays.length > 0 && !powderAlert; // Powder supersedes hero snow

    const alerts = [];

    if (closingWatch) {
        alerts.push({
            id: 'closing-watch',
            title: 'Season Closing Watch',
            description: `Forecast shows ${warmDays} days above 45°F. The snow base may start to thin—get your runs in!`,
            icon: AlertTriangle,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        });
    }

    if (powderAlert) {
        alerts.push({
            id: 'powder-alert',
            title: 'Powder Alert!',
            description: 'Significant snow is forecast in the next 48 hours. Visibility might be low, but the carving will be great.',
            icon: Snowflake,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/20'
        });
    } else if (heroSnowAlert) {
        alerts.push({
            id: 'hero-snow',
            title: 'Hero Snow Conditions',
            description: 'Overnight freezes followed by daytime thaws create "Hero Snow"—perfectly grippy, soft conditions for the morning session.',
            icon: ThermometerSnowflake,
            color: 'text-accent',
            bg: 'bg-accent/10',
            border: 'border-accent/20'
        });
    }

    if (alerts.length === 0) {
        // Dev Simulation: Force an alert to show in development so the user can see it
        if (import.meta.env.DEV) {
            alerts.push({
                id: 'hero-snow-sim',
                title: 'Hero Snow Conditions (Simulated)',
                description: 'This is a simulated alert for local development. In the real app, this appears when overnight freezes followed by daytime thaws create "Hero Snow"—perfectly grippy, soft conditions for the morning session.',
                icon: ThermometerSnowflake,
                color: 'text-accent',
                bg: 'bg-accent/10',
                border: 'border-accent/20'
            });
        }
    }

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3">
            {alerts.map((alert) => (
                <Alert key={alert.id} className={`${alert.bg} ${alert.border} border`}>
                    <alert.icon className={`h-4 w-4 ${alert.color}`} />
                    <AlertTitle className={`text-sm font-bold ${alert.color}`}>{alert.title}</AlertTitle>
                    <AlertDescription className="text-xs text-foreground/80">
                        {alert.description}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}
