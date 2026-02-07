import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Loader2, TrendingUp, Calendar, Zap } from 'lucide-react';
import { ManualEntryDialog } from '@/components/ManualEntryDialog';
import { ForecastWidget } from '@/components/ForecastWidget';
import { Link } from 'wouter';

export default function Dashboard() {
  const utils = trpc.useUtils();
  const { data: seasonStats, isLoading: statsLoading } = trpc.badge.getSeasonStats.useQuery();
  const { data: weeklyData, isLoading: weeklyLoading } = trpc.badge.getWeeklyBreakdown.useQuery();
  const { data: dailyData, isLoading: dailyLoading } = trpc.badge.getDailyBreakdown.useQuery();
  const { data: manualEntries } = trpc.manual.getManualEntries.useQuery();
  const { data: tempAnalysis } = trpc.weather.getTemperatureAnalysis.useQuery();

  const { data: credentials } = trpc.admin.getCredentials.useQuery();
  const [showGlimmer, setShowGlimmer] = useState(false);
  const [lastBadgeCount, setLastBadgeCount] = useState<number | null>(null);

  const isLoading = statsLoading || weeklyLoading || dailyLoading;

  // Trigger glimmer when total badge-ins change
  useEffect(() => {
    if (seasonStats?.stats.totalBadgeIns !== undefined) {
      if (lastBadgeCount !== null && seasonStats.stats.totalBadgeIns > lastBadgeCount) {
        setShowGlimmer(true);
        const timer = setTimeout(() => setShowGlimmer(false), 1000);
        return () => clearTimeout(timer);
      }
      setLastBadgeCount(seasonStats.stats.totalBadgeIns);
    }
  }, [seasonStats?.stats.totalBadgeIns, lastBadgeCount]);

  // Helper to parse YYYY-MM-DD strings or UTC Date objects as local dates to avoid shift
  const parseLocalDate = (dateVal: string | Date) => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) {
      return new Date(dateVal.getUTCFullYear(), dateVal.getUTCMonth(), dateVal.getUTCDate());
    }
    const [year, month, day] = dateVal.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      utils.badge.getSeasonStats.invalidate();
      utils.badge.getWeeklyBreakdown.invalidate();
      utils.badge.getDailyBreakdown.invalidate();
      utils.manual.getManualEntries.invalidate();
      utils.admin.getCredentials.invalidate();
    }, 30000);
    return () => clearInterval(interval);
  }, [utils]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!seasonStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No active season found</p>
      </div>
    );
  }

  const weeklyChartData = weeklyData?.map((w) => ({
    week: parseLocalDate(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: w.count,
  })) || [];

  // Fill in all days from season start to today
  const fillAllDays = () => {
    if (!seasonStats || !dailyData) return [];

    const startDate = parseLocalDate(seasonStats.season.startDate);
    const today = new Date();
    const allDays: { date: string; count: number }[] = [];

    // Create a map of existing data
    const dataMap = new Map(dailyData.map(d => {
      const dateStr = d.date instanceof Date
        ? d.date.toISOString().split('T')[0]
        : d.date;
      return [dateStr, d.count];
    }));

    // Fill in all days
    const current = new Date(startDate);
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      allDays.push({
        date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dataMap.get(dateStr) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return allDays;
  };

  const dailyChartData = fillAllDays();

  return (
    <div className="space-y-6 p-6">
      <ForecastWidget />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`relative overflow-hidden group transition-all duration-500 ${showGlimmer ? 'ring-2 ring-accent/50 scale-[1.02]' : ''}`}>
          {showGlimmer && <div className="absolute inset-0 pointer-events-none animate-glimmer z-10" />}
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Total Hill Days
              <Link href="/history">
                <span className="text-[10px] uppercase tracking-wider text-accent hover:underline cursor-pointer">
                  (View All)
                </span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold transition-all duration-700 ${showGlimmer ? 'text-accent scale-110' : ''}`}>
              {seasonStats.stats.totalBadgeIns}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{seasonStats.stats.daysElapsed} days elapsed</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-500 ${showGlimmer ? 'ring-2 ring-accent/30' : ''}`}>
          {showGlimmer && <div className="absolute inset-0 pointer-events-none animate-glimmer z-10" />}
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Projected Hill Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{seasonStats.projections.average}</div>
            <p className="text-xs text-muted-foreground mt-2">Average scenario</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-500 ${showGlimmer ? 'ring-2 ring-accent/30' : ''}`}>
          {showGlimmer && <div className="absolute inset-0 pointer-events-none animate-glimmer z-10" />}
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" /> Visit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{seasonStats.stats.visitRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">{seasonStats.stats.visitRatePerWeek.toFixed(1)} per week</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-500 ${showGlimmer ? 'ring-2 ring-accent/30' : ''}`}>
          {showGlimmer && <div className="absolute inset-0 pointer-events-none animate-glimmer z-10" />}
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Estimated Days Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{seasonStats.projections.remainingDays}</div>
            <p className="text-xs text-muted-foreground mt-2">Until avg. close date</p>
          </CardContent>
        </Card>
      </div>

      {/* Projection Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Season End Projections</CardTitle>
          <CardDescription>Based on current visit rate and historical weather patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold text-sm mb-2 text-foreground/90">Conservative</h3>
              <p className="text-3xl font-bold mb-2">{seasonStats.projections.conservative}</p>
              <p className="text-xs text-muted-foreground">
                Close: {seasonStats.dates.conservative.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border border-accent">
              <h3 className="font-semibold text-sm mb-2 text-foreground/90">Average (Most Likely)</h3>
              <p className="text-3xl font-bold mb-2">{seasonStats.projections.average}</p>
              <p className="text-xs text-muted-foreground">
                Close: {seasonStats.dates.average.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold text-sm mb-2 text-foreground/90">Optimistic</h3>
              <p className="text-3xl font-bold mb-2">{seasonStats.projections.optimistic}</p>
              <p className="text-xs text-muted-foreground">
                Close: {seasonStats.dates.optimistic.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Note */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-6 flex flex-col gap-4 text-sm text-foreground/90 items-center text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
            ℹ️
          </div>
          <p className="max-w-2xl">
            <strong>Hyland Hills</strong> visits are automatically synced daily on app load. For all other locations, use the <strong>Add Hill Day</strong> button to record your session as a <strong>Non-Hyland</strong> day.
          </p>
        </div>
        {credentials?.lastScrapedAt && (
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/10 border border-muted/20 px-3 py-1.5 rounded-full">
            Hyland Synced: {new Date(credentials.lastScrapedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Hill Days</CardTitle>
            <CardDescription>Hill day count by week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Sweet Spot */}
        {tempAnalysis && tempAnalysis.ranges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Temperature Sweet Spot</CardTitle>
              <CardDescription>
                You visit the hill most when it's <strong>{tempAnalysis.sweetSpot}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tempAnalysis.ranges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="range" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'count') return [value, 'Hill Days'];
                      if (name === 'avgTemp') return [`${value}°F`, 'Avg Temp'];
                      return [value, name];
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-2)"
                    radius={[8, 8, 0, 0]}
                    label={{ position: 'top', fill: 'var(--foreground)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-foreground/70 mt-4 text-center">
                {tempAnalysis.withWeatherData} of {tempAnalysis.totalBadgeIns} hill days have weather data
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Frequency by Day of Week */}
      <Card>
        <CardHeader>
          <CardTitle>Activity by Day of Week</CardTitle>
          <CardDescription>Which days do you visit the hill most often?</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(() => {
              const dayCount = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
              dailyData?.forEach(d => {
                const dayName = parseLocalDate(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                dayCount[dayName as keyof typeof dayCount] += d.count;
              });
              return Object.entries(dayCount).map(([day, count]) => ({ day, count }));
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
              <Bar dataKey="count" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
