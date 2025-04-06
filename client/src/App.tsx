import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import Toast from "./components/toast/Toast"
import EditorPage from "./pages/EditorPage"
import HomePage from "./pages/HomePage"
import { VideoProvider } from "./context/VideoContext"

const App = () => {
    return (
        <>
            <Router>
                <VideoProvider>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/editor/:roomId" element={<EditorPage />} />
                    </Routes>
                </VideoProvider>
            </Router>
            <Toast />
        </>
    )
}

export default App
