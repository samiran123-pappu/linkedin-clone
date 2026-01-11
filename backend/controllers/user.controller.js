import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";


export const getSuggestedConnections = async(req, res)=>{

    try {
        const currentUser = await User.findById(req.user._id).select("connections");

        //find the users who are already not connected also don't recommend the current user
        const suggestedUsers = await User.find({
            _id:{
                $ne: req.user._id,
                $nin: currentUser.connections
            }
        }).limit(5).select("name username profilePicture headline")

        ;

        res.json({
            success:true,
            suggestedUsers,
            currentUser: {
                name: req.user.name,
                profilePicture: req.user.profilePicture
            }
            }
        );
        
    } catch (error) {
        console.log("Error in getting suggested connections", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }

}


export const getPublicProfile = async(req, res)=>{
    try {
        const user = await User.findOne({username: req.params.username}).select("-password");
        if(!user){
            return res.status(404).json({success:false, message:"User not found"});
        }
        res.json({success:true, user});
        
    } catch (error) {
        console.log("Error in getting public profile", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }
}

export const updateProfile = async(req, res)=>{
    try { 
        const allowedFields = [		
            "name",
			"username",
			"headline",
			"about",
			"location",
			"profilePicture",
			"bannerImg",
			"skills",
			"experience",
			"education",
        ];
        const updatedData = {};

        for (const field of allowedFields) {
            if (req.body[field]) {
				updatedData[field] = req.body[field];
			}
        }
        
        if(req.body.profilePicture){
            const result = await cloudinary.uploader.upload(req.body.profilePicture);
            updatedData.profilePicture = result.secure_url;
        }

        if(req.body.bannerImg){
            const result = await cloudinary.uploader.upload(req.body.bannerImg);
            updatedData.bannerImg = result.secure_url;
        }
        
        const user = await User.findByIdAndUpdate(req.user._id,{$set:updatedData}, {new:true}).select("-password");
        res.json({success:true, user});
    } catch (error) {
        console.log("Error in updating profile", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }

}