import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Loader2, TrendingUp, Calendar, Zap } from 'lucide-react';
import { ManualEntryDialog } from '@/components/ManualEntryDialog';
import { ForecastWidget } from '@/components/ForecastWidget';
import { WeatherAlerts } from '@/components/WeatherAlerts';
import { Link } from 'wouter';
import { SeasonSwitcher } from '@/components/SeasonSwitcher';
import { useSeason } from '@/contexts/SeasonContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, Trophy, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const utils = trpc.useUtils();
  const { selectedSeasonId } = useSeason();

  const { data: seasonStats, isLoading: statsLoading, refetch: refetchStats } = trpc.badge.getSeasonStats.useQuery({ seasonId: selectedSeasonId });
  const { data: weeklyData, isLoading: weeklyLoading } = trpc.badge.getWeeklyBreakdown.useQuery({ seasonId: selectedSeasonId });
  const { data: dailyData, isLoading: dailyLoading } = trpc.badge.getDailyBreakdown.useQuery({ seasonId: selectedSeasonId });
  const { data: paceData, isLoading: paceLoading } = trpc.badge.getCumulativePace.useQuery({ seasonId: selectedSeasonId });

  const { data: manualEntries } = trpc.manual.getManualEntries.useQuery();
  const { data: tempAnalysis } = trpc.weather.getTemperatureAnalysis.useQuery();

  const [goalValue, setGoalValue] = useState<string>('50');
  const [estEndValue, setEstEndValue] = useState<string>('');
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTimingDialogOpen, setIsTimingDialogOpen] = useState(false);

  const { data: credentials } = trpc.admin.getCredentials.useQuery();
  const [showGlimmer, setShowGlimmer] = useState(false);
  const [lastBadgeCount, setLastBadgeCount] = useState<number | null>(null);

  const updateSeasonMutation = trpc.badge.updateSeasonSettings.useMutation();

  const isLoading = statsLoading || weeklyLoading || dailyLoading || paceLoading;

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

  useEffect(() => {
    if (seasonStats?.season) {
      setGoalValue(seasonStats.season.goal?.toString() || '50');

      const today = new Date().toISOString().split('T')[0];
      const avgDate = seasonStats.dates?.average
        ? new Date(seasonStats.dates.average).toISOString().split('T')[0]
        : today;

      setEstEndValue(seasonStats.season.estimatedEndDate || avgDate);
    }
  }, [seasonStats?.season, seasonStats?.dates]);

  const handleUpdateSettings = async () => {
    if (!seasonStats?.season.id) return;
    try {
      await updateSeasonMutation.mutateAsync({
        seasonId: seasonStats.season.id,
        goal: parseInt(goalValue),
        estimatedEndDate: estEndValue
      });
      toast.success('Season settings updated!');
      setIsGoalDialogOpen(false);
      setIsTimingDialogOpen(false);
      utils.badge.getSeasonStats.invalidate();
      utils.badge.getCumulativePace.invalidate();
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };


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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <SeasonSwitcher />
        </div>
      </div>

      <ForecastWidget />
      <WeatherAlerts />

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
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Projected Hill Days</span>
              <Dialog open={isTimingDialogOpen} onOpenChange={setIsTimingDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-accent">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Estimated Season End</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="estEnd">Estimated End Date</Label>
                      <Input
                        id="estEnd"
                        type="date"
                        value={estEndValue}
                        onChange={(e) => setEstEndValue(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">Adjusting this will update your Required Weekly Average.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTimingDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateSettings} disabled={updateSeasonMutation.isPending}>
                      Save Date
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{seasonStats.projections.average}</div>
            <p className="text-xs text-muted-foreground mt-2">
              To {parseLocalDate(seasonStats.season.actualEndDate || seasonStats.season.estimatedEndDate || seasonStats.dates.average).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
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
            <div className="text-4xl font-bold">{(seasonStats.stats.visitRate ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">{(seasonStats.stats.visitRatePerWeek ?? 0).toFixed(1)} per week</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-500 ${showGlimmer ? 'ring-2 ring-accent/30' : ''}`}>
          {showGlimmer && <div className="absolute inset-0 pointer-events-none animate-glimmer z-10" />}
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Season Goal</span>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-accent">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Season Goal</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal">Target Hill Days</Label>
                      <Input
                        id="goal"
                        type="number"
                        value={goalValue}
                        onChange={(e) => setGoalValue(e.target.value)}
                        placeholder="e.g. 50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateSettings} disabled={updateSeasonMutation.isPending}>
                      Save Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{seasonStats.season.goal}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {((seasonStats.stats.totalBadgeIns / seasonStats.season.goal) * 100).toFixed(0)}% complete
            </p>
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
        {/* Cumulative Pace Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" /> Cumulative Session Pace
            </CardTitle>
            <CardDescription>Targeting {seasonStats.season.goal} days this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-100%">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paceData?.combined}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    tickFormatter={(val) => parseLocalDate(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    minTickGap={30}
                  />
                  <YAxis stroke="var(--muted-foreground)" domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelFormatter={(val) => parseLocalDate(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="5 5"
                    fill="none"
                    name="Target Pace"
                    strokeWidth={1}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                    name="Total Days"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-3 rounded-md bg-accent/5 border border-accent/10">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Current Pace</span>
                <span className="text-xl font-bold">{seasonStats.stats.totalBadgeIns} days</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md bg-muted/5 border border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Required Avg</span>
                <span className="text-xl font-bold">{((seasonStats.stats as any).neededVisitRatePerWeek ?? 0).toFixed(1)} / week</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
