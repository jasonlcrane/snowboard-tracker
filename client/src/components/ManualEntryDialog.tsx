import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ManualEntryDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const addManualMutation = trpc.manual.addManualEntry.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    try {
      await addManualMutation.mutateAsync({
        badgeInDate: date,
        badgeInTime: time,
        notes: notes || undefined,
      });

      toast.success('Hill day added successfully');
      setDate('');
      setTime('');
      setNotes('');
      setOpen(false);

      // Refresh season stats
      utils.badge.getSeasonStats.invalidate();
      utils.badge.getDailyBreakdown.invalidate();
      utils.badge.getWeeklyBreakdown.invalidate();
      utils.manual.getManualEntries.invalidate();
    } catch (error) {
      toast.error('Failed to add hill day');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Custom Hill Day
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Hill Day</DialogTitle>
          <DialogDescription>
            Record a hill day that wasn't captured by the automated scraper
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="time">Time (Optional)</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Morning session, powder day, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addManualMutation.isPending}>
              {addManualMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Hill Day'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
