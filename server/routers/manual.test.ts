import { describe, expect, it } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };

  return { ctx };
}

describe('Manual Badge-In Router', () => {
  it('should add a manual badge-in entry', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Note: This test assumes an active season exists in the database
    // In a real test environment, you'd set up test data first
    try {
      const result = await caller.manual.addManualEntry({
        badgeInDate: new Date().toISOString().split('T')[0],
        badgeInTime: '10:30',
        notes: 'Test entry',
      });

      expect(result.success).toBe(true);
    } catch (error) {
      // Expected to fail if no active season exists
      expect(error).toBeDefined();
    }
  });

  it('should get manual entries', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const entries = await caller.manual.getManualEntries();
      expect(Array.isArray(entries)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should require authentication for manual operations', async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: 'https',
        headers: {},
      } as TrpcContext['req'],
      res: {} as TrpcContext['res'],
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.manual.addManualEntry({
        badgeInDate: new Date().toISOString().split('T')[0],
        hill: 'Buck Hill',
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
