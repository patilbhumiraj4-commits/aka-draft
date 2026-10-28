const router = require("express").Router();
const ctrl = require("../controllers/postController");
const { protect } = require("../middleware/auth");

router.post("/", protect, ctrl.createPost);
router.get("/", ctrl.getApprovedPosts);

// must stay above "/:id" so "my-posts" is not read as an id
router.get("/my-posts", protect, ctrl.getMyPosts);

router.get("/:id", ctrl.getPostById);
router.patch("/:id", protect, ctrl.updatePost);
router.delete("/:id", protect, ctrl.deletePost);

module.exports = router;
