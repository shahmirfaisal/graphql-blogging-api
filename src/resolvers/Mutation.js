import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import getUserId from "../utils/getUserId";
import nodemailer from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: "config/prod.env" });
const cloudinary = require("cloudinary").v2;
import validator from "validator";

cloudinary.config({
  cloud_name: "dw3ap99ie",
  api_key: "821523511441267",
  api_secret: "gB05RfIeRoEEaWJE-Tfx710utvQ",
});

const transport = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    if (!validator.isByteLength(args.data.name, { min: 1 })) {
      throw new Error("Please enter name!");
    }
    if (!validator.isEmail(args.data.email)) throw new Error("Invalid email!");
    const emailTaken = await prisma.exists.User({ email: args.data.email });
    if (emailTaken) throw new Error("This email already exists!");
    if (args.data.password.length < 8) {
      throw new Error("Password must be 8 characters long!");
    }

    const password = await bcrypt.hash(args.data.password, 12);

    const opArgs = {
      data: {
        ...args.data,
        password,
        image:
          "https://res.cloudinary.com/dw3ap99ie/image/upload/v1590679237/1589133680691-profile-img_bgii9i.jpg",
      },
    };

    const user = await prisma.mutation.createUser(opArgs);

    transport.sendMail({
      from: "shahmir049@gmail.com",
      to: args.data.email,
      subject: "Welcome to our Blog!",
      html: `<p>Hi ${args.data.name}, welcome to our blog.</p>`,
    });

    return {
      user,
      token: jwt.sign({ userId: user.id }, process.env.SECRET, {
        expiresIn: "7d",
      }),
    };
  },

  async login(parent, args, { prisma }, info) {
    const user = await prisma.query.user({
      where: {
        email: args.data.email,
      },
    });
    if (!user) throw new Error("Wrong email!");
    const matchPassword = await bcrypt.compare(
      args.data.password,
      user.password
    );
    if (!matchPassword) throw new Error("Wrong password!");
    return {
      user,
      token: jwt.sign({ userId: user.id }, process.env.SECRET, {
        expiresIn: "7d",
      }),
    };
  },

  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    console.log("Update");

    const userExist = await prisma.exists.User({ id: userId });
    if (!userExist) throw new Error("User not found!");

    if (args.data.image) {
      const res = await cloudinary.uploader.upload(args.data.image);
      args.data.image = res.url;
    }

    return prisma.mutation.updateUser(
      {
        where: {
          id: userId,
        },
        data: args.data,
      },
      info
    );
  },

  async deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const userExist = await prisma.exists.User({ id: userId });
    if (!userExist) throw new Error("User not found!");
    return prisma.mutation.deleteUser(
      {
        where: {
          id: userId,
        },
      },
      info
    );
  },

  async requestResetPassword(parent, { email }, { prisma }, info) {
    const userExist = await prisma.exists.User({ email });
    if (!userExist) throw new Error("No user exist with this email!");

    const buffer = await crypto.randomBytes(32);
    const resetToken = buffer.toString("hex");
    const resetTokenExpiration = (Date.now() + 3600000).toString();

    await prisma.mutation.updateUser({
      where: { email },
      data: { resetToken, resetTokenExpiration },
    });

    await transport.sendMail({
      from: "shahmir049@gmail.com",
      to: email,
      subject: "Password reset request!",
      html: `
        <h1>Password reset request!</h1>
        <a href="http://localhost:3000/forgot-password/${resetToken}">Click here to reset your password</a>
      `,
    });
    return true;
  },

  async resetPassword(parent, { token, password }, { prisma }, info) {
    // How forgot password works
    // Step 1:
    // 1- Take the user's email
    // 2- Check whether this email exist in the database or not
    // 3- Create a unique and secure token(using crypto)
    // 4- Set an expiration time for that token
    // 5- Store the token and the expiration time in the user's object which has that email
    // 6- Send a mail to that user which should contain the token
    // Step 2:
    // 7- Accept the token and the password from the client
    // 8- Check whether the token exist in the database and whether it has expired or not
    // 9- Hash the password and update the user's password

    const user = await prisma.query.user({ where: { resetToken: token } });
    if (!user) throw new Error("Token has been expired!");
    if (user.resetTokenExpiration < Date.now()) {
      throw new Error("Token has been expired!");
    }
    if (password.length < 8) {
      throw new Error("Password must be 8 characters long!");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    return prisma.mutation.updateUser(
      {
        where: { resetToken: token },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiration: null,
        },
      },
      info
    );
  },

  async createPost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const { title, body, description, coverImage, commentsEnabled } = args.data;

    if (!validator.isByteLength(title, { min: 1 })) {
      throw new Error("Please enter title!");
    }
    if (!validator.isByteLength(body, { min: 1 })) {
      throw new Error("Please enter body!");
    }
    if (!validator.isByteLength(description, { min: 1 })) {
      throw new Error("Please enter description!");
    }
    if (!coverImage || !validator.isByteLength(title, { min: 1 })) {
      throw new Error("Please upload cover image!");
    }

    const authorExist = await prisma.exists.User({ id: userId });
    if (!authorExist) throw new Error("Author not found!");

    const res = await cloudinary.uploader.upload(args.data.coverImage);
    args.data.coverImage = res.url;

    const opArgs = {
      data: {
        title,
        body,
        description,
        coverImage,
        commentsEnabled,
        author: {
          connect: {
            id: userId,
          },
        },
      },
    };
    return prisma.mutation.createPost(opArgs, info);
  },

  async updatePost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const postExist = await prisma.exists.Post({
      id: args.id,
      author: { id: userId },
    });
    if (!postExist) throw new Error("Unable to update the post!");
    return prisma.mutation.updatePost(
      {
        where: {
          id: args.id,
        },
        data: args.data,
      },
      info
    );
  },

  async deletePost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const postExist = await prisma.exists.Post({
      id: args.id,
      author: { id: userId },
    });
    if (!postExist) throw new Error("Post not found!");
    return prisma.mutation.deletePost(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
  },

  async createComment(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    if (!validator.isByteLength(args.data.text, { min: 1 })) {
      throw new Error("Please enter text!");
    }

    const authorExist = await prisma.exists.User({ id: userId });
    const postExist = await prisma.exists.Post({
      id: args.data.post,
      commentsEnabled: true,
    });
    if (!authorExist) throw new Error("Author not found!");
    if (!postExist) throw new Error("Unable to add the comment!");
    return prisma.mutation.createComment(
      {
        data: {
          text: args.data.text,
          author: {
            connect: {
              id: userId,
            },
          },
          post: {
            connect: {
              id: args.data.post,
            },
          },
        },
      },
      info
    );
  },

  async updateComment(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const commentExist = await prisma.exists.Comment({
      id: args.id,
      author: { id: userId },
    });
    if (!commentExist) throw new Error("Unable to update comment!");
    return prisma.mutation.updateComment(
      {
        where: {
          id: args.id,
        },
        data: args.data,
      },
      info
    );
  },

  async deleteComment(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    console.log("HELLO");

    const comment = await prisma.query.comment(
      { where: { id: args.id } },
      "{ id author { id } post { id author { id } } }"
    );

    console.log(comment, "Comment");

    if (!comment) throw new Error("Comment not found!");
    if (comment.author.id === userId || comment.post.author.id === userId) {
      return prisma.mutation.deleteComment(
        {
          where: {
            id: args.id,
          },
        },
        info
      );
    }

    throw new Error("Unable to delete comment!");
  },
};

export default Mutation;
