import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

export function AutoSyncTrigger() {
    const { user } = useAuth();
    const utils = trpc.useUtils();
    const triggerAutoSyncMutation = trpc.admin.triggerAutoSync.useMutation();
    const hasTriggered = useRef(false);

    useEffect(() => {
        // Only trigger once per session and only for admins
        if (user?.role === 'admin' && !hasTriggered.current) {
            hasTriggered.current = true;

            const trigger = async () => {
                try {
                    const result = await triggerAutoSyncMutation.mutateAsync();

                    if (result.status === 'triggered') {
                        toast.info('Syncing Hyland Data...', {
                            description: 'Latest badge-in history is being updated automatically.',
                            duration: 5000,
                        });

                        // Wait for it to finish and then show success
                        // Note: triggerAutoSync in backend already finishes the scrape before returning
                        toast.success('Hyland Sync Complete', {
                            description: `Added ${result.badgeInsAdded} new entries.`,
                        });

                        // Refetch all data
                        utils.badge.getSeasonStats.invalidate();
                        utils.badge.getWeeklyBreakdown.invalidate();
                        utils.badge.getDailyBreakdown.invalidate();
                        utils.admin.getCredentials.invalidate();
                    }
                } catch (error) {
                    console.error('Auto-sync failed:', error);
                    // Silence error for auto-sync to not bother the user unless it's a manual action
                }
            };

            trigger();
        }
    }, [user, triggerAutoSyncMutation, utils]);

    return null;
}
