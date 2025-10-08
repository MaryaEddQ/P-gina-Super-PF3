import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import DOMPurify from "isomorphic-dompurify";

export default function Details() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tool-details/${slug}`);
        if (!res.ok) throw new Error("Detalhes não encontrados");
        const data = await res.json();
        setTool(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500 animate-pulse">
        Carregando detalhes...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600">
        ❌ Erro: {error} <br />
        <Link to="/" className="text-blue-600 underline">
          Voltar
        </Link>
      </div>
    );

  if (!tool)
    return (
      <div className="p-6 text-center text-gray-600">
        Nenhum detalhe encontrado.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tool.title}</h1>
          {tool.badge && (
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                tool.badge === "Novo"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {tool.badge}
            </span>
          )}
        </div>

        <Link
          to="/"
          className="text-sm text-blue-700 border px-3 py-1 rounded-lg hover:bg-blue-50"
        >
          ← Voltar
        </Link>
      </div>

      {/* Imagem */}
      {tool.imageUrl && (
        <img
          src={tool.imageUrl}
          alt={tool.title}
          className="w-full rounded-xl mb-4 border object-cover max-h-[400px]"
        />
      )}

      {/* Descrição curta */}
      {tool.description && (
        <p className="text-gray-700 mb-6 leading-relaxed">{tool.description}</p>
      )}

      {/* Metadados opcionais */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
        {tool.owner && (
          <p>
            <strong>Responsável:</strong> {tool.owner}
          </p>
        )}
        {tool.owner_contact && (
          <p>
            <strong>Contato:</strong> {tool.owner_contact}
          </p>
        )}
        {tool.update_schedule && (
          <p>
            <strong>Atualização:</strong> {tool.update_schedule}
          </p>
        )}
        {tool.data_source && (
          <p>
            <strong>Fonte:</strong> {tool.data_source}
          </p>
        )}
        {tool.data_source_url && (
          <p>
            <strong>Link da Fonte:</strong>{" "}
            <a
              href={tool.data_source_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline break-all"
            >
              {tool.data_source_url}
            </a>
          </p>
        )}
        {tool.access_requirements && (
          <p className="sm:col-span-2">
            <strong>Requisitos de acesso:</strong> {tool.access_requirements}
          </p>
        )}
        {tool.tags && (
          <p className="sm:col-span-2">
            <strong>Tags:</strong>{" "}
            {tool.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-block mr-2 mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
          </p>
        )}
      </div>

      {/* Conteúdo principal: HTML (WYSIWYG) → fallback para Markdown */}
      <div className="prose max-w-none prose-blue prose-sm sm:prose-base">
        {tool.content_html ? (
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(tool.content_html),
            }}
          />
        ) : tool.content_md ? (
          <ReactMarkdown>{tool.content_md}</ReactMarkdown>
        ) : (
          <p className="text-gray-500 italic">
            Conteúdo em construção. Volte em breve!
          </p>
        )}
      </div>

      {/* Changelog opcional */}
      {(tool.changelog_html || tool.changelog_md) && (
        <div className="prose max-w-none prose-sm sm:prose-base mt-8">
          <h2>Histórico de mudanças</h2>
          {tool.changelog_html ? (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(tool.changelog_html),
              }}
            />
          ) : (
            <ReactMarkdown>{tool.changelog_md}</ReactMarkdown>
          )}
        </div>
      )}

      {/* Acesso à ferramenta */}
      {tool.linkUrl && (
        <div className="mt-8 flex justify-center">
          <a
            href={tool.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2 text-sm font-medium hover:bg-blue-700 transition"
          >
            Acessar ferramenta
          </a>
        </div>
      )}

      {/* Data de atualização */}
      {tool.updated_at && (
        <p className="mt-6 text-xs text-gray-400 text-center">
          Última atualização:{" "}
          {new Date(tool.updated_at).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}
