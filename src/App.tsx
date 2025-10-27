import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Feature-based imports
import { MappingPage } from "./features/mapping";
import { ExportsManagerPage } from "./features/exports-manager";
import { Toaster } from 'sonner';

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<MappingPage />} />
                    <Route path="/manage" element={<ExportsManagerPage />} />
                </Routes>
                <Toaster position="top-center" richColors />
            </Router>
        </>
    );
}

export default App;