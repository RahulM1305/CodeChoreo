import { useAppContext } from "@/context/AppContext"
import { toast } from "react-hot-toast"

const RoomInfo = () => {
    const { currentUser } = useAppContext()

    const handleCopyRoomId = () => {
        const roomUrl = `${window.location.origin}${window.location.pathname}?roomId=${currentUser.roomId}`
        navigator.clipboard.writeText(roomUrl)
        toast.success("Room link copied to clipboard!")
    }
} 