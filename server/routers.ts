import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { badgeRouter } from "./routers/badge";
import { adminRouter } from "./routers/admin";
import { manualRouter } from "./routers/manual";
import { weatherRouter } from "./routers/weather";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  badge: badgeRouter,
  admin: adminRouter,
  manual: manualRouter,
  weather: weatherRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
