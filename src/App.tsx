import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JsonMapperVisualizer from "./pages/JsonMapperVisualizer.tsx";
import MappingExportsManager from "./pages/MappingExportsManager.tsx";
import { Toaster } from 'sonner';

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<JsonMapperVisualizer />} />
                    <Route path="/manage" element={<MappingExportsManager />} />
                </Routes>
                <Toaster position="top-center" richColors />
            </Router>
        </>
    );
}

export default App;