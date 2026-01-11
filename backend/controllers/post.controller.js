import Post from "../models/post.model.js";
import cloudinary from "../lib/cloudinary.js";
import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";
import Notification from "../models/notification.model.js";


export const getFeedPosts = async(req, res)=>{
    try {
        const posts = await Post.find({author:{$in:[...req.user.connections, req.user._id]}})
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture")
        .sort({ createdAt: -1})
        res.json({success:true, posts});
        
    } catch (error) {
        console.log("Error in getting feed posts", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }
} 


export const createPost = async(req, res)=>{
    try {
        const {content, image} = req.body;
        console.log("Request received - Content:", content);
        console.log("Request received - Image exists:", !!image);
        console.log("Image length:", image ? image.length : "no image");
        
        let newPost;
        if(image){
            console.log("Uploading image to Cloudinary...");
            try {
                const imgResult = await cloudinary.uploader.upload(image);
                console.log("Image uploaded successfully:", imgResult.secure_url);
                newPost = await new Post({content, image:imgResult.secure_url, author:req.user._id});
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError.message);
                return res.status(400).json({success:false, message:"Image upload failed: " + uploadError.message});
            }
        }else{
            console.log("No image provided");
            newPost = await new Post({content, author:req.user._id});
        }
        await newPost.save();
        // Populate author details before returning
        await newPost.populate("author", "name username profilePicture headline");
        console.log("Post saved to DB:", newPost);
        res.json({success:true, post:newPost});
    } catch (error) {
        console.log("Error in creating post", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }

}

export const deletePost = async(req, res)=>{
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId)
        if(!post){
            return res.status(404).json({success:false, message:"Post not found"});
        }
        //check if the post belongs to the user
        if(post.author.toString() !== userId.toString()){
            return res.status(401).json({success:false, message:"Unauthorized"});
        }
        //delete image from cloudinary
        if(post.image){
            //https://res.cloudinary.com/username/image/upload/v1670000000/abc.jpg
            await cloudinary.uploader.destroy(post.image.split("/").pop().split(".")[0]);
        }
        await Post.findByIdAndDelete(postId);
        res.json({success:true, message:"Post deleted successfully"});
        
    } catch (error) {
        console.log("Error in deleting post", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }
}


export const getPostById = async(req, res)=>{
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId)
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture headline username");
        if(!post){
            return res.status(404).json({success:false, message:"Post not found"});
        }
        res.json({success:true, post});

        
    } catch (error) {
        console.log("Error in getting post by id", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }
}

export const createComment = async(req, res)=>{
    try{
        const postId = req.params.id;
        const{content} =req.body;

        if(!content || !content.trim()){
            return res.status(400).json({success:false, message:"Comment content cannot be empty"});
        }

        // ✅ Update post with new comment and populate everything
        const post = await Post.findByIdAndUpdate(
            postId,
            {
                $push:{comments:{user:req.user._id, content, createdAt: new Date()}}
            }, 
            {new:true}
        )
        .populate("author", "name email username headline profilePicture")
        .populate("comments.user", "name profilePicture headline username");

        if(!post){
            return res.status(404).json({success:false, message:"Post not found"});
        }

        // Only send notification if the commenter is not the post author
        if(post.author._id.toString() !== req.user._id.toString()){
            const newNotification = new Notification({
                recipient:post.author._id,
                type:"comment",
                relatedUser:req.user._id,
                relatedPost:postId
            })
            await newNotification.save();

            try{
                const postUrl = process.env.CLIENT_URL + "/post/" + postId;
                await sendCommentNotificationEmail(post.author.email, post.author.name, req.user.name, postUrl, content);
            }catch(error){
                console.log("Error in sending comment notification email", error.message);
            }
        }
        
        // ✅ Return full post with updated comments
        res.status(201).json({success:true, post});

    }catch(error){
        console.log("Error in creating comment " , error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
    }
}



export const likePost = async(req, res)=>{
    try{
        const postId = req.params.id;
        const post = await Post.findById(postId)
        const userId = req.user._id;
        if(post.likes.includes(userId)){
            // unlikes the post
            post.likes = post.likes.filter(id=>id.toString() !== userId.toString());
        }else{
            // likes the post 
            post.likes.push(userId);

            //create notification if the user doesnt like the post 
            if(post.author.toString() !== userId.toString()){
                const newNotification = new Notification({
                    recipient:post.author,
                    type:"like",
                    relatedUser:userId,
                    relatedPost:postId
                })
                await newNotification.save();
            }
        }
        await post.save();
        res.json({success:true, post});


    }catch(error){
        console.log("Error in liking post", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});

    }

}

