import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const { data: credentials, isLoading: credLoading } = trpc.admin.getCredentials.useQuery();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.getScrapingLogs.useQuery({ limit: 50 });
  const saveCredentialsMutation = trpc.admin.saveCredentials.useMutation();
  const triggerScrapeMutation = trpc.admin.triggerManualScrape.useMutation({
    onMutate: () => {
      // Optimistically refetch to show the pending log immediately
      // The backend creates the pending log first
      setTimeout(() => refetchLogs(), 500);
    },
    onSuccess: () => {
      refetchLogs();
    }
  });

  // Polling for pending logs
  useEffect(() => {
    const hasPending = logs?.some(log => log.status === 'pending');
    let interval: NodeJS.Timeout;

    if (hasPending) {
      interval = setInterval(() => {
        refetchLogs();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [logs, refetchLogs]);

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
    } catch (error) {
      toast.error('Failed to save credentials');
    }
  };

  const handleTriggerScrape = async () => {
    try {
      await triggerScrapeMutation.mutateAsync();
      toast.success('Hyland data download complete');
    } catch (error) {
      toast.error('Failed to trigger download');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Manage account credentials and automated data downloads</p>
      </div>

      {/* Credentials Section */}
      <Card>
        <CardHeader>
          <CardTitle>Three Rivers Parks Account</CardTitle>
          <CardDescription>Your credentials are encrypted and stored securely</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Your Three Rivers Parks username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your Three Rivers Parks password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>

            {credentials && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Credentials last updated: {new Date(credentials.lastScrapedAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            )}

            <Button type="submit" disabled={saveCredentialsMutation.isPending}>
              {saveCredentialsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data Download Control */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Data Download</CardTitle>
          <CardDescription>Trigger an immediate download of your Hyland badge-in history</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTriggerScrape} disabled={triggerScrapeMutation.isPending}>
            {triggerScrapeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              'Download Hyland Data'
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Hyland data is automatically synced daily. Use this to manually refresh.
          </p>
        </CardContent>
      </Card>

      {/* Scraping Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Hyland Sync History</CardTitle>
          <CardDescription>Recent Hyland data download activity and results</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(showAllLogs ? logs : logs.slice(0, 1)).map((log) => (
                  <div key={log.id} className={`p-3 rounded-lg border border-border bg-card transition-all ${!showAllLogs ? 'ring-2 ring-accent/20' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : log.status === 'failed' ? (
                            <X className="w-4 h-4 text-red-500" />
                          ) : log.status === 'pending' ? (
                            <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-yellow-500" />
                          )}
                          <span className={`font-medium text-sm capitalize ${log.status === 'pending' ? 'animate-pulse text-accent' : ''}`}>
                            {log.status === 'pending' ? 'Syncing...' : log.status}
                          </span>
                          {!showAllLogs && logs.length > 1 && (
                            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Latest</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {log.status === 'pending' ? (
                          <p className="text-xs text-muted-foreground italic">Fetching data...</p>
                        ) : (
                          <>
                            <p className="text-sm font-medium">{log.badgeInsAdded} added</p>
                            <p className="text-xs text-muted-foreground">{log.badgeInsFound} found</p>
                          </>
                        )}
                      </div>
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-red-500 mt-2">{log.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>

              {logs.length > 1 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    className="text-xs text-muted-foreground hover:text-accent"
                  >
                    {showAllLogs ? 'Hide historical logs' : `Show ${logs.length - 1} more logs`}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No scraping logs yet</p>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Understanding the automated hill tracking system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-sm">Connect Your Account</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Enter your Three Rivers Parks credentials above. They are encrypted using AES-256-GCM before being stored in the database.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-semibold text-sm">Automatic Sync</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                A background worker runs every night at 2:00 AM CST to fetch your latest hill visit history. You can also trigger it manually using the button above.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-semibold text-sm">Data & Analytics</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                The dashboard calculates your visit frequency and projects your season-end totals based on historical weather patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
