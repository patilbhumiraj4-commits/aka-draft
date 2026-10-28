const Post = require("../models/Post");

const POPULATE = { path: "createdBy", select: "name email" };

// POST /posts  — create a draft, or submit straight for approval with status: "pending"
exports.createPost = async (req, res, next) => {
  try {
    const { title, description, content, image, category, status } = req.body;
    const finalStatus = status === "pending" ? "pending" : "draft";
    const post = await Post.create({
      title,
      description,
      content,
      image,
      category,
      status: finalStatus,
      createdBy: req.user._id,
    });
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};

// GET /posts  — all approved posts (optional ?category=&search=)
exports.getApprovedPosts = async (req, res, next) => {
  try {
    const filter = { status: "approved" };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };
    const posts = await Post.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    res.json({ count: posts.length, posts });
  } catch (err) {
    next(err);
  }
};

// GET /posts/my-posts  — own posts and drafts
exports.getMyPosts = async (req, res, next) => {
  try {
    const filter = { createdBy: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json({ count: posts.length, posts });
  } catch (err) {
    next(err);
  }
};

// GET /posts/:id  — an approved post by ID
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, status: "approved" }).populate(POPULATE);
    if (!post) return res.status(404).json({ message: "Approved post not found" });
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

// PATCH /posts/:id  — update own post
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!post.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    ["title", "description", "content", "image", "category"].forEach((f) => {
      if (req.body[f] !== undefined) post[f] = req.body[f];
    });

    // Owners may only move a post to draft or pending (submit for approval).
    if (req.body.status !== undefined) {
      if (!["draft", "pending"].includes(req.body.status)) {
        return res.status(400).json({ message: "status can only be set to 'draft' or 'pending'" });
      }
      post.status = req.body.status;
    } else if (["approved", "rejected"].includes(post.status)) {
      // Editing a published/rejected post sends it back to the owner as a draft.
      post.status = "draft";
    }

    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

// DELETE /posts/:id  — delete own post
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!post.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
};
