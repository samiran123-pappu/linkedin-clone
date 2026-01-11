import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";

import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import toast from "react-hot-toast";
const ProfilePage = () => {
    const { username } = useParams();
    const queryClient = useQueryClient();

    const { data: authUser, isLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get("/auth/me");
                return res.data;
            } catch (err) {
                if (err.response?.status === 401) {
                    return null;
                }
                throw err;
            }
        },
    });

    const isOwnProfile = authUser?.username === username;

    const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
        queryKey: ["userProfile", username],
        queryFn: async () => {
            const res = await axiosInstance.get(`/users/${username}`);
            return res.data.user;
        },
        enabled: !!username && !!authUser && !isOwnProfile,
    });

    const { mutate: updateProfile } = useMutation({
        mutationFn: async (updatedData) => {
            await axiosInstance.put("/users/profile", updatedData);
        },
        onSuccess: () => {
            toast.success("Profile updated successfully");
            queryClient.invalidateQueries(["authUser"]);
            queryClient.invalidateQueries(["userProfile", username]);
        },
    });

    if (isLoading || !authUser) return null;
    if (!isOwnProfile && (isUserProfileLoading || !userProfile)) return null;

    const userData = isOwnProfile ? authUser : userProfile;

    const handleSave = (updatedData) => {
        updateProfile(updatedData);
    };
    return (
        <div className='max-w-4xl mx-auto p-4'>
            <ProfileHeader userData={userData} authUser={authUser} isOwnProfile={isOwnProfile} onSave={handleSave} />
            <AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
            <ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
            <EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
            <SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
        </div>
    )
}

export default ProfilePage