import { useEffect, useState } from "react";
import { getTools } from "../api";
import ToolCard from "../components/ToolCard";
import { Settings } from "lucide-react";

export default function Home() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTools()
      .then(setTools)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <h1 className="text-xl font-bold mb-4">Ferramentas</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  );
}
