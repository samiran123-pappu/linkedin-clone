import Notification from "../models/notification.model.js";

export const getUserNotifications = async(req, res)=>{
    try {
        const notifications = await Notification.find({recipient:req.user._id}).sort({createdAt:-1}).populate("relatedUser", "name username profilePicture").populate("relatedPost", "content image")

        res.status(200).json({success:true, notifications});
        
    } catch (error) {
        console.error("Error in getting user notifications", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
    }
}



export const markNotificationAsRead = async(req, res)=>{
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findByIdAndUpdate(
            {_id:notificationId, recipient:req.user._id},
            {read:true},
            {new:true}
        );

        res.status(200).json({success:true, notification});

        
        
    } catch (error) {
        console.error("Error in marking notification as read", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }
}


export const deleteNotification = async(req, res)=>{
    try {
        const notificationId = req.params.id;
        await Notification.findOneAndDelete({
            _id:notificationId,
            recipient:req.user._id
        })

        res.status(200).json({success:true, message:"Notification deleted successfully"});
        
    } catch (error) {
        res.status(500).json({success:false, message:"Internal Server Error"});
        
        
    }

}