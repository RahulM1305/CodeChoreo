import { useAppContext } from "@/context/AppContext"
import { toast } from "react-hot-toast"

const RoomInfo = () => {
    const { currentUser } = useAppContext()

    const handleCopyRoomId = () => {
        const roomUrl = `${window.location.origin}${window.location.pathname}?roomId=${currentUser.roomId}`
        navigator.clipboard.writeText(roomUrl)
        toast.success("Room link copied to clipboard!")
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-[#0f0d15] rounded-md">
            <h2 className="text-xl font-bold mb-2">Room Information</h2>
            <p className="mb-2">Room ID: <span className="font-mono">{currentUser.roomId}</span></p>
            <button 
                onClick={handleCopyRoomId}
                className="px-4 py-2 bg-green-500 text-black rounded-md hover:bg-green-600 transition-colors"
            >
                Copy Room Link
            </button>
        </div>
    )
}

export default RoomInfo 