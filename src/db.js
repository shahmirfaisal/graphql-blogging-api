const users = [
  {
    id: 1,
    name: "Shahmir",
  },
  {
    id: 2,
    name: "Ali",
  },
];

const posts = [
  {
    id: 1,
    title: "Learn Reactjs",
    author: 1,
  },
  {
    id: 2,
    title: "Learn GraphQL",
    author: 2,
  },
];

const comments = [
  {
    id: 1,
    text: "Amazing",
    author: 1,
    post: 1,
  },
  {
    id: 2,
    text: "Ridiculous",
    author: 2,
    post: 2,
  },
];

const db = {
  users,
  posts,
  comments,
};

export default db;
