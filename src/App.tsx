import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import JsonMapperVisualizer from "./components/JsonMapperVisualizer";
import { Toaster } from 'sonner';

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<JsonMapperVisualizer />} />
                </Routes>
                <Toaster position="top-center" richColors />
            </Router>
        </>
    );
}

export default App;