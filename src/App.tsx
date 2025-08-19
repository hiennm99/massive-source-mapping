import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import JsonMapperVisualizer from "./components/JsonMapperVisualizer";
import MappingExportsManager from "./components/MappingExportsManager.tsx";
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