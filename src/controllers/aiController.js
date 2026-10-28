const { GoogleGenAI } = require("@google/genai");
const Post = require("../models/Post");

let client;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error("GEMINI_API_KEY is not configured");
    err.status = 500;
    throw err;
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

// POST /ai/improve/:postId
// Improves the content with Gemini and saves it as a NEW draft under the same
// user. The original post is left untouched.
exports.improvePost = async (req, res, next) => {
  try {
    const original = await Post.findById(req.params.postId);
    if (!original) return res.status(404).json({ message: "Post not found" });
    if (!original.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only improve your own posts" });
    }

    const prompt = [
      "You are an expert editor. Improve the following blog post: fix grammar and spelling,",
      "improve clarity, flow and structure, and keep the author's meaning, voice and language.",
      "Do not add new facts. Return ONLY the improved post content, with no preamble or notes.",
      req.body && req.body.instructions ? `Extra instructions: ${req.body.instructions}` : "",
      "",
      `Title: ${original.title}`,
      "",
      original.content,
    ].join("\n");

    let improved;
    try {
      const result = await getClient().models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt,
      });
      improved = (result.text || "").trim();
    } catch (aiErr) {
      if (aiErr.status === 500 && /not configured/.test(aiErr.message)) throw aiErr;
      const err = new Error(`AI service error: ${aiErr.message}`);
      err.status = 502;
      throw err;
    }
    if (!improved) {
      return res.status(502).json({ message: "AI returned an empty response, try again" });
    }

    const newPost = await Post.create({
      title: original.title,
      description: original.description,
      content: improved,
      image: original.image,
      category: original.category,
      createdBy: req.user._id,
      status: "draft",
      improvedFrom: original._id,
    });

    res.status(201).json({
      message: "Improved version saved as a new draft",
      originalId: original._id,
      post: newPost,
    });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};
