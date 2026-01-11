import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../../lib/axios"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import { Bell, Home, LogOut, User, Users } from "lucide-react"

const Navbar = () => {
    const queryClient = useQueryClient()

    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get("/auth/me")
                return res.data
            } catch (err) {
                if (err.response?.status === 401) {
                    return null
                }
                toast.error(err.response?.data?.message || "Something went wrong")
                return null
            }
        }
    })

    const { data: notifications } = useQuery({
        queryKey: ["notifications"],
        enabled: !!authUser,
        queryFn: async () => {
            try {
                const res = await axiosInstance.get("/notifications")
                return res.data?.notifications ?? []
            } catch (err) {
                if (err.response?.status === 401) {
                    return []
                }
                toast.error(err.response?.data?.message || "Failed to load notifications")
                return []
            }
        }
    })

    const { data: connectionRequests } = useQuery({
        queryKey: ["connectionRequests"],
        enabled: !!authUser,
        queryFn: async () => {
            try {
                const res = await axiosInstance.get("/connections/requests")
                return Array.isArray(res.data) ? res.data : []
            } catch (err) {
                if (err.response?.status === 401) {
                    return []
                }
                toast.error(err.response?.data?.message || "Failed to load requests")
                return []
            }
        }
    })

    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.post("/auth/logout")
            return res.data
        },
        onSuccess: () => {
            toast.success("User logged out successfully")
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to logout")
        }
    })

    const unreadNotificationCount = (notifications || []).filter((notif) => !notif.read).length
    const unreadConnectionRequestsCount = (connectionRequests || []).length

    return (
        <nav className='bg-secondary shadow-md sticky top-0 z-10'>
            <div className='max-w-7xl mx-auto px-4'>
                <div className='flex justify-between items-center py-3'>
                    <div className='flex items-center space-x-4'>
                        <Link to='/'>
                            <img className='h-8 rounded' src='/small-logo.png' alt='LinkedIn' />
                        </Link>
                    </div>
                    <div className='flex items-center gap-2 md:gap-6'>
                        {authUser ? (
                            <>
                                <Link to={"/"} className='text-neutral flex flex-col items-center'>
                                    <Home size={20} />
                                    <span className='text-xs hidden md:block'>Home</span>
                                </Link>
                                <Link to='/network' className='text-neutral flex flex-col items-center relative'>
                                    <Users size={20} />
                                    <span className='text-xs hidden md:block'>My Network</span>
                                    {unreadConnectionRequestsCount > 0 && (
                                        <span
                                            className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs 
										rounded-full size-3 md:size-4 flex items-center justify-center'
                                        >
                                            {unreadConnectionRequestsCount}
                                        </span>
                                    )}
                                </Link>
                                <Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
                                    <Bell size={20} />
                                    <span className='text-xs hidden md:block'>Notifications</span>
                                    {unreadNotificationCount > 0 && (
                                        <span
                                            className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs 
										rounded-full size-3 md:size-4 flex items-center justify-center'
                                        >
                                            {unreadNotificationCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    to={`/profile/${authUser.username}`}
                                    className='text-neutral flex flex-col items-center'
                                >
                                    <User size={20} />
                                    <span className='text-xs hidden md:block'>Me</span>
                                </Link>
                                <button
                                    className='flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800'
                                    onClick={() => logout()}
                                >
                                    <LogOut size={20} />
                                    <span className='hidden md:inline'>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to='/login' className='btn btn-ghost'>
                                    Sign In
                                </Link>
                                <Link to='/signup' className='btn btn-primary'>
                                    Join now
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
