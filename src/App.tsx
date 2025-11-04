import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FormulaMode from "./pages/FormulaMode";
import InputMode from "./pages/InputMode";
import DrawingMode from "./pages/DrawingMode";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/formula" element={<FormulaMode />} />
        <Route path="/input" element={<InputMode />} />
        <Route path="/drawing" element={<DrawingMode />} />
      </Routes>
    </div>
  );
}