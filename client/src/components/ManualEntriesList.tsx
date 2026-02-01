import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ManualEntriesList() {
  const { data: entries, isLoading } = trpc.manual.getManualEntries.useQuery();
  const deleteManualMutation = trpc.manual.deleteManualEntry.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteManualMutation.mutateAsync({ id });
      toast.success('Entry deleted');
      utils.badge.getSeasonStats.invalidate();
      utils.badge.getDailyBreakdown.invalidate();
      utils.badge.getWeeklyBreakdown.invalidate();
      utils.manual.getManualEntries.invalidate();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Shred Days</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Shred Days</CardTitle>
          <CardDescription>No custom shred days yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add custom shred days using the "Add Custom Shred Day" button above
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Shred Days</CardTitle>
        <CardDescription>{entries.length} custom shred day(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {entry.time && ` at ${entry.time}`}
                </p>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(entry.id)}
                disabled={deleteManualMutation.isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
