import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, MapPin, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function HistoryPage() {
    const { data: badgeIns, isLoading, refetch } = trpc.badge.getAllBadgeIns.useQuery();
    const deleteManualMutation = trpc.manual.deleteManualEntry.useMutation();

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this custom hill day?')) return;
        try {
            await deleteManualMutation.mutateAsync({ id });
            toast.success('Deleted successfully');
            refetch();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tighter mb-2">Hill Day History</h1>
                <p className="text-muted-foreground">Detailed log of all snowboarding sessions this season.</p>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle>Session Log</CardTitle>
                    <CardDescription>
                        {badgeIns?.length || 0} total hill days recorded
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Date</TableHead>
                                <TableHead>Day</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-center">Temp</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {badgeIns?.map((entry) => {
                                const dateObj = new Date(entry.badgeInDate);
                                // Adjust for local time display
                                const localDateStr = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())
                                    .toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                const weekday = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())
                                    .toLocaleDateString('en-US', { weekday: 'short' });

                                return (
                                    <TableRow key={entry.id} className="group transition-colors hover:bg-muted/50">
                                        <TableCell className="font-medium">{localDateStr}</TableCell>
                                        <TableCell className="text-muted-foreground">{weekday}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                                <span className={entry.isManual ? "text-accent font-medium" : "text-foreground"}>
                                                    {entry.isManual ? (entry.passType || 'Non-Hyland') : 'Hyland Hills'}
                                                </span>
                                                {entry.isManual && entry.notes && (
                                                    <span className="text-[10px] text-muted-foreground italic ml-1">
                                                        ({entry.notes})
                                                    </span>
                                                )}
                                                {!entry.isManual && (
                                                    <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-accent/10 border-accent/20 text-accent">
                                                        Auto
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {entry.tempHigh ? (
                                                <div className="flex items-center justify-center gap-1 text-sm">
                                                    <Thermometer className="w-3 h-3 text-red-400" />
                                                    {Math.round(Number(entry.tempHigh))}°
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">--</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {entry.isManual ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(entry.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Locked</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {(!badgeIns || badgeIns.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No hill days recorded yet this season.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
