import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Target, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSeason } from '@/contexts/SeasonContext';

export default function SettingsPage() {
    const { selectedSeasonId } = useSeason();
    const utils = trpc.useUtils();

    // Season Settings State
    const [goalValue, setGoalValue] = useState<string>('50');
    const [estEndValue, setEstEndValue] = useState<string>('');
    const [actEndValue, setActEndValue] = useState<string>('');

    const { data: seasonStats, isLoading: statsLoading } = trpc.badge.getSeasonStats.useQuery({ seasonId: selectedSeasonId });
    const updateSeasonMutation = trpc.badge.updateSeasonSettings.useMutation();

    useEffect(() => {
        if (seasonStats?.season) {
            setGoalValue(seasonStats.season.goal?.toString() || '50');
            setEstEndValue(seasonStats.season.estimatedEndDate || '');
            setActEndValue(seasonStats.season.actualEndDate || '');
        }
    }, [seasonStats?.season]);

    const handleUpdateSettings = async () => {
        if (!seasonStats?.season.id) return;
        try {
            await updateSeasonMutation.mutateAsync({
                seasonId: seasonStats.season.id,
                goal: parseInt(goalValue),
                estimatedEndDate: estEndValue,
                actualEndDate: actEndValue
            });
            toast.success('Season settings updated!');
            utils.badge.getSeasonStats.invalidate();
            utils.badge.getCumulativePace.invalidate();
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your season goals, timing, and account preferences</p>
            </div>

            <div className="grid gap-6">
                {/* Season Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-accent" /> Season Management
                        </CardTitle>
                        <CardDescription>
                            Configure the targets and dates for the {seasonStats?.season.name || 'current season'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="goal">Target Hill Days</Label>
                                <div className="relative">
                                    <Input
                                        id="goal"
                                        type="number"
                                        value={goalValue}
                                        onChange={(e) => setGoalValue(e.target.value)}
                                        placeholder="e.g. 50"
                                        className="pl-9"
                                    />
                                    <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Your total goal for the entire winter.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estEnd">Estimated End Date</Label>
                                <Input
                                    id="estEnd"
                                    type="date"
                                    value={estEndValue}
                                    onChange={(e) => setEstEndValue(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">When resorts usually close (defines the pace line).</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="actEnd">Actual End Date</Label>
                                <Input
                                    id="actEnd"
                                    type="date"
                                    value={actEndValue}
                                    onChange={(e) => setActEndValue(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">Sets the season as completed and locks projections.</p>
                            </div>
                        </div>

                        {actEndValue && !seasonStats?.season.actualEndDate && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start gap-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-tight">Warning: Seasonal Lock</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Setting an <strong>Actual End Date</strong> will officially close this season. Your projections will stop, your final counts will be frozen, and the dashboard will shift to a post-season view. Only do this once you've put your board away for the summer!
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-border flex justify-end">
                            <Button onClick={handleUpdateSettings} disabled={updateSeasonMutation.isPending} className="px-8">
                                {updateSeasonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Informational Card */}
                <Card className="bg-accent/5 border-accent/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Pro Tip
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your <strong>Estimated End Date</strong> directly affects your "Required Weekly Average."
                            If you feel like you aren't going to make it, try setting a more realistic end date (like mid-April)
                            to see how it lowers the bar for your weekly hill days!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
