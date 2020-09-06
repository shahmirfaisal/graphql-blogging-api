const Subscription = {
  comment: {
    subscribe(parent, { postId }, { prisma }, info) {
      return prisma.subscription.comment(
        {
          where: {
            node: {
              post: {
                id: postId,
              },
            },
          },
        },
        info
      );
    },
  },

  post: {
    subscribe(parent, args, { prisma }, info) {
      return prisma.subscription.post(null, info);
    },
  },
};

export default Subscription;