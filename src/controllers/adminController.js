const Post = require("../models/Post");

// GET /admin/posts/pending
exports.getPendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: "pending" })
      .populate("createdBy", "name email")
      .sort({ createdAt: 1 });
    res.json({ count: posts.length, posts });
  } catch (err) {
    next(err);
  }
};

const review = (newStatus) => async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Only pending posts can be reviewed (current status: ${post.status})` });
    }
    post.status = newStatus;
    await post.save();
    res.json({ message: `Post ${newStatus}`, post });
  } catch (err) {
    next(err);
  }
};

// PATCH /admin/posts/approve/:id
exports.approvePost = review("approved");

// PATCH /admin/posts/reject/:id
exports.rejectPost = review("rejected");
