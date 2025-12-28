import { Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Details from "./pages/Details";
import { Settings } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-800">
            Super PF³
          </Link>

          <nav className="flex gap-2">
            <NavLink
              to="/admin"
              className="flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
              title="Painel de Administração"
            >
              <Settings size={18} strokeWidth={2} />
              <span className="hidden sm:inline">Painel</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/detalhes/:slug" element={<Details />} />
          {/* <Route path="*" element={<div>Página não encontrada</div>} /> */}
        </Routes>
      </main>

      <footer className="border-t py-6 text-center text-xs text-gray-500">
        Núcleo Super PF3 - Desenvolvido por Maria Quadros
      </footer>
    </div>
  );
}
