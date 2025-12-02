import { useEffect, useState } from "react";
import { getTools } from "../api";
import ToolCard from "../components/ToolCard";
import BarSearch from "../components/BarSearch";

export default function Home() {
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // 👈 NOVO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTools()
      .then((res) => {
        setTools(res);
        setFilteredTools(res);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Lista de categorias distintas (para o <select>)
  const categories = Array.from(
    new Set(
      tools.map((t) => t.category).filter(Boolean) // remove undefined/null/vazio
    )
  );

  // FILTRAR EM TEMPO REAL (texto + categoria)
  useEffect(() => {
    const lower = search.toLowerCase();

    const filtered = tools.filter((tool) => {
      const texto = `${tool.title || ""} ${
        tool.description || ""
      }`.toLowerCase();

      const matchesText = texto.includes(lower);

      const matchesCategory =
        !categoryFilter || (tool.category && tool.category === categoryFilter);

      return matchesText && matchesCategory;
    });

    setFilteredTools(filtered);
  }, [search, tools, categoryFilter]);

  if (loading) return <p>Carregando…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      {/* Barra de busca + filtro de categoria */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="sm:flex-1">
          <BarSearch value={search} onChange={setSearch} />
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2 bg-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h1 className="text-xl font-bold mb-4">Ferramentas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  );
}
