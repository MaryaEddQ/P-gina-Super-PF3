import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getTools } from "../api";
import ToolCard from "../components/ToolCard";
import BarSearch from "../components/BarSearch";

export default function Home() {
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Paginação
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  // ======= Restaura filtros salvos =======
  useEffect(() => {
    const savedSearch = localStorage.getItem("tools_search") || "";
    const savedCategory = localStorage.getItem("tools_category") || "";
    setSearch(savedSearch);
    setCategoryFilter(savedCategory);
  }, []);

  // ======= Salva filtros =======
  useEffect(() => {
    localStorage.setItem("tools_search", search);
    localStorage.setItem("tools_category", categoryFilter);
  }, [search, categoryFilter]);

  // ======= ESC limpa busca =======
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setSearch("");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ======= Carrega tools =======
  useEffect(() => {
    getTools()
      .then((res) => {
        setTools(res);
        setFilteredTools(res);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ======= Categorias (limpas e ordenadas) =======
  const categories = useMemo(() => {
    return Array.from(
      new Set(tools.map((t) => (t.category || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tools]);

  // ======= Filtro (texto + categoria) =======
  useEffect(() => {
    const lower = search.trim().toLowerCase();

    const filtered = tools.filter((tool) => {
      const texto = `${tool.title || ""} ${tool.description || ""} ${
        tool.category || ""
      }`.toLowerCase();

      const matchesText = texto.includes(lower);

      const matchesCategory =
        !categoryFilter ||
        (tool.category && tool.category.trim() === categoryFilter);

      return matchesText && matchesCategory;
    });

    setFilteredTools(filtered);
    setPage(1); // sempre volta pra 1 quando filtrar
  }, [search, categoryFilter, tools]);

  // ======= Paginação =======
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTools.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTools = filteredTools.slice(startIndex, endIndex);

  // ======= Helpers =======
  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setPage(1);
  };

  // ======= UI states =======
  if (loading) {
    return (
      <>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="sm:flex-1 h-12 rounded-xl bg-gray-200 animate-pulse" />
          <div className="w-full sm:w-64 h-12 rounded-xl bg-gray-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      {/* Busca + filtro + limpar */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_320px] gap-4 mb-4">
        {/* ESQUERDA: Busca */}
        <div>
          <BarSearch value={search} onChange={setSearch} />
        </div>

        {/* DIREITA: Categoria + Botão abaixo alinhado à direita */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por categoria
          </label>

          <select
            className="w-full h-[40px] rounded-lg border border-gray-300 px-3 bg-white text-sm"
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

          <div className="flex justify-end mt-2">
            <button
              onClick={clearFilters}
              className=" border-gray-300 px-4 py-2
                   text-xs font-medium text-blue-600 underline
                   hover:bg-gray-100 hover:text-gray-800 transition"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho + contagem */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Ferramentas</h1>
        <p className="text-sm text-gray-600">
          Mostrando {paginatedTools.length} de {filteredTools.length}
        </p>
      </div>

      {/* Estado vazio */}
      {filteredTools.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg font-medium">
            Nenhuma ferramenta encontrada 😕
          </p>
          <p className="text-sm mt-1">
            Tente mudar o termo de busca ou a categoria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-full border px-4 py-2 text-sm hover:bg-gray-100 transition"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTools.map((tool) => {
              const param = tool.slug ?? tool.id; // fallback
              return (
                <Link key={tool.id} to={`/detalhes/${param}`} className="block">
                  <ToolCard tool={tool} />
                </Link>
              );
            })}
          </div>

          {/* Paginação (números + anterior/próxima) */}
          {filteredTools.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col items-center gap-3 mt-8">
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-100 transition"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>

                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    const active = n === page;

                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition
                          ${
                            active
                              ? "bg-blue-600 text-white"
                              : "border hover:bg-gray-100"
                          }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="rounded-full border px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-100 transition"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
