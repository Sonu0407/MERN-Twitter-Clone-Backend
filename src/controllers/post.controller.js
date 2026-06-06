import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) return res.status(200).json([]);

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found." });

    if (!text && !img)
      return res.status(400).json({ error: "Post much have text or image" });

    if (img) {
      // upload to cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });
    await newPost.save();

    const populatedPost = await Post.findById(newPost._id).populate(
      "user",
      "fullName username profileImage",
    );

    return res.status(201).json(populatedPost);
  } catch (error) {
    console.log("Error in create post function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    // console.log(postId);

    const post = await Post.findById(postId);

    if (!post) return res.status(400).json({ error: "Post Not Found" });

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // if liked then dislike it
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString(),
      );
      return res.status(200).json(updatedLikes);
    } else {
      // if unliked then like it
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });

      await notification.save();

      const updatedLikes = post.likes;
      return res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in likeUnlikePost function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) return res.status(400).json({ error: "Text field is required" });

    const post = await Post.findById(postId);

    if (!post) return res.status(400).json({ error: "Post not found" });

    const comment = { user: userId, text };

    post.comments.push(comment);
    await post.save();

    return res.status(200).json(post);
  } catch (error) {
    console.log("Error in commentOn post function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.user._id.toString())
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post" });

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in delete post function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in getLikedPosts function ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in getLikedPosts function ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User Not Found" });

    const post = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json(post);
  } catch (error) {
    console.log("Error in getLikedPosts function ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
