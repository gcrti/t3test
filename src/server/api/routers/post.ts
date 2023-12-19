import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/api";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return { id: user.id, username: user.username, imageUrl: user.imageUrl };
};

export const postRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ content: z.string().min(1), authorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          content: input.content,
          authorId: input.authorId,
        },
      });
    }),

  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author || !author.username)
        throw new TRPCError({
          message: "Autor da postagem não encontrado",
          code: "INTERNAL_SERVER_ERROR",
        });

      return {
        post,
        author,
      };
    });
  }),
});
