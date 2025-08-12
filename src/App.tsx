
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import JsonMapperVisualizer from "./components/JsonMapperVisualizer";

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<JsonMapperVisualizer />} />
                </Routes>
            </Router>
        </>
    );
}

export default App;
