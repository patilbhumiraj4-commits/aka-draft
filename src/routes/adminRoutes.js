const router = require("express").Router();
const ctrl = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

router.get("/posts/pending", ctrl.getPendingPosts);
router.patch("/posts/approve/:id", ctrl.approvePost);
router.patch("/posts/reject/:id", ctrl.rejectPost);

module.exports = router;
