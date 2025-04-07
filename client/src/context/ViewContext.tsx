import ChatsView from "@/components/sidebar/sidebar-views/ChatsView"
import CopilotView from "@/components/sidebar/sidebar-views/CopilotView"
import FilesView from "@/components/sidebar/sidebar-views/FilesView"
import RunView from "@/components/sidebar/sidebar-views/RunView"
import SettingsView from "@/components/sidebar/sidebar-views/SettingsView"
import UsersView from "@/components/sidebar/sidebar-views/UsersView"
import VideoCallView from "@/components/sidebar/sidebar-views/VideoCallView"
import useWindowDimensions from "@/hooks/useWindowDimensions"
import { VIEWS, ViewContext as ViewContextType } from "@/types/view"
import { ReactNode, createContext, useContext, useState } from "react"
import { IoSettingsOutline, IoHome, IoCode, IoDocumentText, IoVideocam } from "react-icons/io5"
import { LuFiles, LuSparkles } from "react-icons/lu"
import { PiChats, PiPlay, PiUsers } from "react-icons/pi"

const ViewContext = createContext<ViewContextType | null>(null)

export const useViews = (): ViewContextType => {
    const context = useContext(ViewContext)
    if (!context) {
        throw new Error("useViews must be used within a ViewContextProvider")
    }
    return context
}

function ViewContextProvider({ children }: { children: ReactNode }) {
    const { isMobile } = useWindowDimensions()
    const [activeView, setActiveView] = useState<VIEWS>(VIEWS.FILES)
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(!isMobile)
    const [viewComponents] = useState({
        [VIEWS.HOME]: <div>Home View</div>,
        [VIEWS.CODE]: <div>Code View</div>,
        [VIEWS.CHAT]: <div>Chat View</div>,
        [VIEWS.DOCS]: <div>Docs View</div>,
        [VIEWS.FILES]: <FilesView />,
        [VIEWS.CLIENTS]: <UsersView />,
        [VIEWS.SETTINGS]: <SettingsView />,
        [VIEWS.COPILOT]: <CopilotView />,
        [VIEWS.CHATS]: <ChatsView />,
        [VIEWS.RUN]: <RunView />,
        [VIEWS.VIDEO_CALL]: <VideoCallView />,
    })
    const [viewIcons] = useState({
        [VIEWS.HOME]: <IoHome size={28} />,
        [VIEWS.CODE]: <IoCode size={28} />,
        [VIEWS.CHAT]: <PiChats size={30} />,
        [VIEWS.DOCS]: <IoDocumentText size={28} />,
        [VIEWS.FILES]: <LuFiles size={28} />,
        [VIEWS.CLIENTS]: <PiUsers size={30} />,
        [VIEWS.SETTINGS]: <IoSettingsOutline size={28} />,
        [VIEWS.CHATS]: <PiChats size={30} />,
        [VIEWS.COPILOT]: <LuSparkles size={28} />,
        [VIEWS.RUN]: <PiPlay size={28} />,
        [VIEWS.VIDEO_CALL]: <IoVideocam size={28} />,
    })

    return (
        <ViewContext.Provider
            value={{
                activeView,
                setActiveView,
                isSidebarOpen,
                setIsSidebarOpen,
                viewComponents,
                viewIcons,
            }}
        >
            {children}
        </ViewContext.Provider>
    )
}

export { ViewContextProvider }
export default ViewContext
