import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, Camera } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export default function Sidebar({ user }) {
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: uploadProfilePicture, isPending } = useMutation({
        mutationFn: async (imageData) => {
            const res = await axiosInstance.put("/users/profile", { profilePicture: imageData });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            toast.success("Profile picture updated!");
            setIsUploadingPicture(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to upload picture");
        },
    });

    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
            fileReader.readAsDataURL(file);
        });
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const dataUrl = await readFileAsDataURL(file);
            uploadProfilePicture(dataUrl);
        }
    };

    if (!user) return null;

    return (
        <div className='bg-secondary rounded-lg shadow'>
            <div className='p-4 text-center'>
                <div
                    className='h-16 rounded-t-lg bg-cover bg-center'
                    style={{
                        backgroundImage: `url("${user?.bannerImg || "/banner.png"}")`,
                    }}
                />
                <Link to={`/profile/${user?.username}`}>
                    <div className="relative inline-block">
                        <img
                            src={user?.profilePicture?.trim() ? user.profilePicture : "/avatar.png"}
                            alt={user?.name}
                            className='w-20 h-20 rounded-full mx-auto mt-[-40px] object-cover border-4 border-secondary'
                        />
                        <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark rounded-full p-2 cursor-pointer transition">
                            <Camera size={14} className="text-white" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePictureChange}
                                disabled={isPending}
                            />
                        </label>
                    </div>
                    <h2 className='text-xl font-semibold mt-2'>{user?.name}</h2>
                </Link>
                <p className='text-info'>{user?.headline}</p>
                <p className='text-info text-xs'>{user?.connections?.length} connections</p>
            </div>
            <div className='border-t border-base-100 p-4'>
                <nav>
                    <ul className='space-y-2'>
                        <li>
                            <Link
                                to='/'
                                className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                            >
                                <Home className='mr-2' size={20} /> Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                to='/network'
                                className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                            >
                                <UserPlus className='mr-2' size={20} /> My Network
                            </Link>
                        </li>
                        <li>
                            <Link
                                to='/notifications'
                                className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                            >
                                <Bell className='mr-2' size={20} /> Notifications
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className='border-t border-base-100 p-4'>
                <Link to={`/profile/${user.username}`} className='text-sm font-semibold'>
                    Visit your profile
                </Link>
            </div>
        </div>
    );
}