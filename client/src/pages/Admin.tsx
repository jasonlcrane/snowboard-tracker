import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useSeason } from '@/contexts/SeasonContext';

export default function Admin() {
  const { selectedSeasonId } = useSeason();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [actEndValue, setActEndValue] = useState<string>('');

  const { data: credentials, isLoading: credLoading } = trpc.admin.getCredentials.useQuery();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.getScrapingLogs.useQuery({ limit: 50 });
  const { data: seasonStats, refetch: refetchStats } = trpc.badge.getSeasonStats.useQuery({ seasonId: selectedSeasonId });

  const saveCredentialsMutation = trpc.admin.saveCredentials.useMutation();
  const updateSeasonMutation = trpc.badge.updateSeasonSettings.useMutation();
  const triggerScrapeMutation = trpc.admin.triggerManualScrape.useMutation({
    onMutate: () => {
      setTimeout(() => refetchLogs(), 500);
    },
    onSuccess: () => {
      refetchLogs();
      refetchStats();
      setIsEditingCredentials(false);
    }
  });

  useEffect(() => {
    if (seasonStats?.season) {
      setActEndValue(seasonStats.season.actualEndDate || '');
    }
  }, [seasonStats?.season]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    try {
      await saveCredentialsMutation.mutateAsync({ username, password });
      toast.success('Credentials saved securely');
      setUsername('');
      setPassword('');
      setIsEditingCredentials(false);
    } catch (error) {
      toast.error('Failed to save credentials');
    }
  };

  const handleUpdateSeasonEnd = async () => {
    if (!selectedSeasonId) return;
    try {
      await updateSeasonMutation.mutateAsync({
        seasonId: selectedSeasonId,
        actualEndDate: actEndValue
      });
      toast.success('Season closure settings updated');
      refetchStats();
    } catch (error) {
      toast.error('Failed to update season closure');
    }
  };

  const syncWeatherMutation = trpc.admin.syncWeather.useMutation();

  const handleTriggerWeatherSync = async () => {
    try {
      const result = await syncWeatherMutation.mutateAsync();
      toast.success(result.message);
    } catch (error) {
      toast.error('Failed to sync weather data');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin & Management</h1>
        <p className="text-muted-foreground mt-2">Manage account credentials, syncs, and season status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credentials Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Three Rivers Parks Account</CardTitle>
              {!isEditingCredentials && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingCredentials(true)}>
                  {credentials ? 'Update' : 'Add'}
                </Button>
              )}
            </div>
            <CardDescription>Securely store your Hyland portal access</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingCredentials ? (
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button type="button" variant="outline" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saveCredentialsMutation.isPending}>Save</Button>
                  <Button variant="ghost" onClick={() => setIsEditingCredentials(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                {credentials ? (
                  <><Check className="text-green-500 w-4 h-4" /> <span>Account Linked</span></>
                ) : (
                  <><X className="text-red-500 w-4 h-4" /> <span>Not Linked</span></>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sync Controls</CardTitle>
            <CardDescription>Manually trigger scraping of hill entries or weather</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => triggerScrapeMutation.mutate()} disabled={triggerScrapeMutation.isPending}>
              {triggerScrapeMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
              Sync Hyland
            </Button>
            <Button variant="outline" onClick={handleTriggerWeatherSync} disabled={syncWeatherMutation.isPending}>
              {syncWeatherMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <RefreshCw className="mr-2 w-4 h-4" />}
              Sync Weather
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Season Closure Section */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" /> Season Closure Management
          </CardTitle>
          <CardDescription>Setting an actual end date marks the season as finished and freezes all calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="actEnd">Actual End Date</Label>
            <Input id="actEnd" type="date" value={actEndValue} onChange={(e) => setActEndValue(e.target.value)} />
          </div>
          {actEndValue && !seasonStats?.season.actualEndDate && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-muted-foreground italic leading-tight">
                Warning: Saving this will mark the season as <strong>completed</strong>.
              </p>
            </div>
          )}
          <Button variant="destructive" onClick={handleUpdateSeasonEnd} disabled={updateSeasonMutation.isPending}>
            {updateSeasonMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
            {seasonStats?.season.actualEndDate ? 'Update Closure Date' : 'Close Season'}
          </Button>
        </CardContent>
      </Card>

      {/* Logs section restored simplified */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent automated and manual sync attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs?.map((log: any) => (
              <div key={log.id} className="text-xs p-2 flex justify-between border-b last:border-0 border-border">
                <span>{new Date(log.createdAt).toLocaleString()}</span>
                <span className={log.status === 'success' ? 'text-green-500' : 'text-red-500'}>{log.status}</span>
                <span>{log.badgeInsAdded} added</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
