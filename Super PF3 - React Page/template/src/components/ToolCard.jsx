import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function ToolCard({ tool }) {
  return (
    <div className="group relative rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300">
      {/* Imagem + overlay */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {tool.imageUrl ? (
          <>
            <img
              src={tool.imageUrl}
              alt={tool.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-100">
            Sem imagem
          </div>
        )}

        {/* Badge opcional */}
        {tool.badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm
              ${
                tool.badge === "Novo"
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 animate-pulse"
                  : "bg-amber-100 text-amber-700 ring-1 ring-amber-300 animate-pulse"
              }`}
          >
            {tool.badge}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
          {tool.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 line-clamp-6">
          {tool.description}
        </p>
        <a
          href={tool.linkUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          Acessar ferramenta
          <ExternalLink className="h-4 w-4" />
        </a>
        {/* 🔗 Link para página de detalhes */}
        {tool.detailsSlug && (
          <div className="mt-3 text-center">
            <Link
              to={`/detalhes/${tool.detailsSlug}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              Ver detalhes →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
