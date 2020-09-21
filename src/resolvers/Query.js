import getUserId from "../utils/getUserId";

const Query = {
  users(parent, args, { prisma }, info) {
    const opArgs = {
      where: {
        name_contains: args.search,
      },
      first: args.first,
      skip: args.skip,
    };

    return prisma.query.users(opArgs, info);
  },

  async user(parent, args, { prisma }, info) {
    const opArgs = {
      where: {
        id: args.id,
      },
    };
    const user = await prisma.query.user(opArgs, info);
    if (!user) throw new Error("User not found!");
    return user;
  },

  async isLogin(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const user = await prisma.query.user(
      {
        where: {
          id: userId,
        },
      },
      info
    );
    if (!user) throw new Error("User not found!");
    return user;
  },

  posts(parent, args, { prisma }, info) {
    const opArgs = {
      where: {
        title_contains: args.search,
        author: {
          id: args.userId,
        },
      },
      first: args.first,
      skip: args.skip,
      orderBy: args.orderBy,
    };

    return prisma.query.posts(opArgs, info);
  },

  async post(parent, args, { prisma }, info) {
    const opArgs = {
      where: { id: args.id },
    };
    const post = await prisma.query.post(opArgs, info);
    if (!post) throw new Error("Post not found!");
    return post;
  },

  comments(parent, args, { prisma }, info) {
    const opArgs = {
      where: {
        text_contains: args.search,
        post: {
          id: args.postId,
        },
      },
      first: args.first,
      skip: args.skip,
    };

    return prisma.query.comments(opArgs, info);
  },

  async comment(parent, args, { prisma }, info) {
    const opArgs = {
      where: { id: args.id },
    };
    const comment = await prisma.query.comment(opArgs, info);
    if (!comment) throw new Error("Comment not found!");
    return comment;
  },
};

export default Query;
