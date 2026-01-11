import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Check, UserPlus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";


const RecommendedUser = ({ user }) => {
    const queryClient = useQueryClient();
    const { data: connectionStatus, isLoading } = useQuery({
        queryKey: ["connectionStatus", user._id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/connections/status/${user._id}`);
            return res.data;
        }
    })


    const { mutate: sendConnectionRequest } = useMutation({
        mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] })
            toast.success("Connection req send successfully")
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.message || "Failed to send connection request";
            toast.error(errorMessage);
            console.error("Connection request error:", err);
        }
    })

    const { mutate: acceptRequest } = useMutation({
        mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] })
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.message || "Failed to accept connection request";
            toast.error(errorMessage);
            console.error("Accept request error:", err);
        }
    })

    const { mutate: rejectRequest } = useMutation({
        mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] })
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.message || "Failed to reject connection request";
            toast.error(errorMessage);
            console.error("Reject request error:", err);


        }
    })

    const renderButton = () => {
        if (isLoading) {
            return (
                <button className="px-3 py-1 rounded-full text-sm bg-yellow-500 text-white flex items-center" disabled>
                    Loading...
                </button>
            )

        }

        switch (connectionStatus?.status) {
            case "pending":
                return (
                    <button
                        className="px-3 py-1 rounded-full text-sm bg-gray-500 text-white cursor-not-allowed"
                        disabled
                    >
                        <Clock size={16} className="mr-1" />
                        Pending
                    </button>
                );
            case "received":
                return (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => acceptRequest(connectionStatus.requestId)}
                            className={`rounded-full p-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white`}
                        >
                            <Check size={16} />

                        </button>
                        <button
                            onClick={() => rejectRequest(connectionStatus.requestId)}
                            className={`rounded-full p-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white`}

                        >
                            <X size={16} />

                        </button>
                    </div>

                );
            case "connected":
                return (
                    <button
                        className='px-3 py-1 rounded-full text-sm border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center'
                        onClick={handleConnect}

                    >
                        <UserPlus size={16} className='mr-1' />
                        Connect
                    </button>
                );


            default:
                return (
                    <button
                        className='px-3 py-1 rounded-full text-sm border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center'
                        onClick={() => sendConnectionRequest(user._id)}
                    >
                        <UserPlus size={16} className='mr-1' />
                        Connect
                    </button>
                );
        }

    }


    const handleConnect = () => {
        if (connectionStatus?.status === "notConnected" || connectionStatus?.status === "not_connected") {
            sendConnectionRequest(user._id);
        }
    };





    return (
        <div className="flex items-center justify-between mb-4">
            <Link to={`/profile/${user.username}`} className="flex items-center flex-grow">
                <img
                    src={user.profilePicture?.trim() ? user.profilePicture : "/avatar.png"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-gray-600">{user.headline}</p>
                </div>
            </Link>
            {renderButton()}

        </div>

    )
}

export default RecommendedUser