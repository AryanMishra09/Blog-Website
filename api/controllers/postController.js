import Post from "../models/postModel.js";
import { errorHandler } from "../utils/error.js"

//to create a new posts (/api/post/create)
export const create = async (req, res, next) => {
    if(!req.user.isAdmin){
        return next(errorHandler(403, "You are not allowed to create a post"));
    } 
    if(!req.body.title || !req.body.content){
        return next(errorHandler(400, 'Please provide all required fields!'));
    }
    const slug = req.body.title.split(" ").join('-').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    const newPost = new Post({
        ...req.body,
        slug,
        userId: req.user.id,
      });
      try {
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
      } catch (error) {
        next(error);
      }
};

//to get all posts (/api/post/getposts)
export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order ==='asc' ? 1 : -1;
    const posts = await Post.find({
      ...(req.query.userId && {userId: req.query.userId}),
      ...(req.query.category && {userId: req.query.category}),
      ...(req.query.slug && {userId: req.query.slug}),
      ...(req.query.postId && {userId: req.query.postId}),
      ...(req.query.searchTerm && {
        $or: [
          {title: {$regex: req.query.searchTerm, $options: 'i'}},
          {content: {$regex: req.query.searchTerm, $options: 'i'}},
        ]
      }),
    }).sort({updatedAt: sortDirection}).skip(startIndex).limit(limit);
    const totalPost = await Post.countDocuments();
    const now = new Date();
    const onemonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastMonthPosts = await Post.countDocuments({
      createdAt: {$gte: onemonthAgo}
    });
    res.status(200).json({
      posts,
      totalPost,
      lastMonthPosts,
    })
  } catch (error) {
    next(error);
  }
};