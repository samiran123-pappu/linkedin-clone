import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link, Loader, ThumbsUp, Trash2, MessageCircle, Share2, Send } from "lucide-react";
import { useParams } from "react-router-dom";
import PostAction from "./PostAction";
import { formatDistanceToNow } from "date-fns";

const Post = ({ post }) => {
    const { postId } = useParams();
    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me")
            return res.data
        }
    });
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState(post?.comments || []);

    // ✅ SYNC comments when post prop updates (e.g. after refetch)
    useEffect(() => {
        setComments(post?.comments || []);
    }, [post?.comments]);

    const author = post?.author;
    const likes = post?.likes || [];
    const isOwner = !!authUser?._id && !!author?._id && authUser._id === author._id;
    const isLiked = !!authUser?._id && Array.isArray(likes) && likes.includes(authUser._id);

    const queryClient = useQueryClient();

    const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
        mutationFn: async () => {
            await axiosInstance.delete(`/posts/delete/${post._id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            toast.success("Post deleted successfully");
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || error.message || "Failed to delete post";
            toast.error(errorMessage);
            console.error("Delete error:", error);
        },
    });


    const { mutate: createComment, isPending: isAddingComment } = useMutation({
        mutationFn: async (commentContent) => {
            const res = await axiosInstance.post(`/posts/${post._id}/comment`, { content: commentContent });
            return res.data;
        },
        onSuccess: (response) => {
            // ✅ Update local state immediately (optimistic)
            const updatedPost = response.post;
            if (updatedPost && updatedPost.comments) {
                setComments(updatedPost.comments);
            }
            setNewComment("");
            toast.success("Comment added successfully");

            // ✅ Refetch to ensure sync with server (belt + suspenders)
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.message || "Failed to add comment";
            toast.error(errorMessage);
            console.error("Comment error:", err);
        },
    });

    const { mutate: likePost, isPending: isLikingPost } = useMutation({
        mutationFn: async () => {
            await axiosInstance.post(`/posts/${post._id}/like`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["post", postId] });
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || "Failed to like post";
            toast.error(errorMessage);
            console.error("Like error:", error);
        },
    });
    const handleDeletePost = () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        deletePost();
    };


    const handleLikePost = async () => {
        if (isLikingPost) return;
        likePost();
    }

    const handleAddComment = (e) => {
        e.preventDefault();

        if (!authUser) {
            toast.error("Please log in to comment");
            return;
        }

        const trimmedComment = newComment.trim();
        if (!trimmedComment) {
            toast.error("Comment cannot be empty");
            return;
        }

        createComment(trimmedComment);
    };
    return (
        <div className="bg-secondary rounded-lg shadow mb-4">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Link to={`/profile/${post?.author?.username}`}>
                            <img
                                src={post?.author?.profilePicture?.trim() ? post.author.profilePicture : "/avatar.png"}
                                alt={post?.author?.name || "User"}
                                className="size-10 rounded-full mr-3 object-cover"
                                onError={(e) => { e.target.src = "/avatar.png"; }}
                            />
                        </Link>

                        <div>
                            <Link to={`/profile/${post?.author?.username}`}>
                                <h3 className="font-semibold">{post?.author?.name || "Unknown User"}</h3>
                            </Link>
                            <p className="text-xs text-info">{post?.author?.headline || "No headline"}</p>
                            <p className='text-xs text-info'>
                                {post?.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Just now"}
                            </p>

                        </div>
                    </div>

                    {isOwner && (
                        <button
                            onClick={handleDeletePost}
                            className="text-red-500 hover:text-red-700"
                        >
                            {isDeletingPost ? (
                                <Loader size={18} className="animate-spin" />
                            ) : (
                                <Trash2 size={18} />
                            )}
                        </button>
                    )}
                </div>
                <p className='mb-4'>{post?.content || ""}</p>
                {post?.image && <img src={post.image} alt='Post content' className='rounded-lg w-full mb-4' />}
                <div className="flex items-center justify-between mt-4">
                    <PostAction
                        icon={<ThumbsUp size={18} className={isLiked ? "text-blue-500  fill-blue-300" : ""} />}
                        text={`Like (${likes.length})`}
                        onClick={handleLikePost}

                    />
                    <PostAction
                        icon={<MessageCircle size={18} />}
                        text={`Comment (${comments.length})`}
                        onClick={() => setShowComments(!showComments)}
                    />
                    <PostAction icon={<Share2 size={18} />} text='Share' />

                </div>
            </div>
            {showComments && (
                <div className="px-4 pb-4">
                    <div className='mb-4 max-h-60 overflow-y-auto'>
                        {comments.map((comment) => (
                            <div key={comment._id} className='mb-2 bg-base-100 p-2 rounded flex items-start'>
                                <img
                                    src={comment?.user?.profilePicture?.trim() ? comment.user.profilePicture : "/avatar.png"}
                                    alt={comment?.user?.name || "User"}
                                    className='w-8 h-8 rounded-full mr-2 flex-shrink-0 object-cover'
                                    onError={(e) => { e.target.src = "/avatar.png"; }}
                                />
                                <div className='flex-grow'>
                                    <div className='flex items-center mb-1'>
                                        <span className='font-semibold mr-2'>{comment?.user?.name || "Unknown"}</span>
                                        <span className='text-xs text-info'>
                                            {comment?.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "Just now"}
                                        </span>
                                    </div>
                                    <p>{comment?.content || ""}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddComment} className='flex items-center'>
                        <input
                            type='text'
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder='Add a comment...'
                            className='flex-grow p-2 rounded-l-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary'
                        />

                        <button
                            type='submit'
                            className='bg-primary text-white p-2 rounded-r-full hover:bg-primary-dark transition duration-300'
                            disabled={isAddingComment}
                        >
                            {isAddingComment ? <Loader size={18} className='animate-spin' /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Post