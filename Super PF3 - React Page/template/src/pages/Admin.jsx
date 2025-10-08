import { useEffect, useState, Suspense, lazy } from "react";
import { getTools, createTool, updateTool, deleteTool } from "../api";
import { Pencil, Trash2 } from "lucide-react";
import "react-quill/dist/quill.snow.css";

// carregamento dinâmico do ReactQuill (evita erro de render)
const ReactQuill = lazy(() => import("react-quill"));

// Estrutura base de ferramenta
const empty = {
  title: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  badge: "",
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "blockquote", "code"],
    ["clean"],
  ],
};
const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "align",
  "link",
  "blockquote",
  "code",
];

export default function Admin() {
  const [tools, setTools] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [details, setDetails] = useState({
    slug: "",
    content_md: "",
    content_html: "",
  });

  // ==============================
  // Helpers
  // ==============================
  function toSlug(str = "") {
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  function isValidSlug(slug = "") {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3;
  }

  // ==============================
  // API
  // ==============================
  const load = async () => {
    try {
      setTools(await getTools());
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  async function loadDetails(toolId) {
    try {
      const res = await fetch(`/api/tool-details/by-tool/${toolId}`);
      const json = await res.json();
      setDetails({
        slug: json?.slug || "",
        content_md: json?.content_md || "",
        content_html: json?.content_html || "",
      });
    } catch {
      setDetails({ slug: "", content_md: "", content_html: "" });
    }
  }

  async function saveDetails(e) {
    e.preventDefault();
    if (!editingId) return;

    const wantSave =
      (details.slug && details.slug.trim().length > 0) ||
      (details.content_md && details.content_md.trim().length > 0) ||
      (details.content_html && details.content_html.trim().length > 0);

    if (!wantSave) {
      alert("Nada para salvar nos detalhes.");
      return;
    }

    // gera slug se vazio mas houver conteúdo
    let slug = (details.slug || "").trim();
    if (!slug) slug = toSlug(form.title);

    slug = toSlug(slug);
    if (!isValidSlug(slug)) {
      alert("Slug inválido. Use minúsculas, números e hífens (min 3 chars).");
      return;
    }

    const payload = {
      tool_id: editingId,
      slug,
      content_md: details.content_md || "",
      content_html: details.content_html || "",
    };

    const res = await fetch("/api/tool-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Erro ao salvar detalhes: " + (err.error || res.status));
      return;
    }

    setDetails((d) => ({ ...d, slug })); // normaliza na UI
    alert("Detalhes salvos com sucesso!");
    load();
  }

  // ==============================
  // Upload de imagem
  // ==============================
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Falha no upload");
      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      alert("Erro ao enviar imagem: " + err.message);
    }
  };

  // ==============================
  // CRUD de ferramentas
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl,
        badge: form.badge || null,
      };

      let createdOrEdited;
      if (editingId) {
        await updateTool(editingId, payload);
        createdOrEdited = { id: editingId };
      } else {
        createdOrEdited = await createTool(payload); // { id, ... }
      }

      // se houver QUALQUER conteúdo de detalhes, salvar (gera slug se faltar)
      const hasAnyDetails =
        (details.slug && details.slug.trim().length > 0) ||
        (details.content_md && details.content_md.trim().length > 0) ||
        (details.content_html && details.content_html.trim().length > 0);

      if (hasAnyDetails) {
        let slug = (details.slug || "").trim();
        if (!slug) slug = toSlug(form.title);

        slug = toSlug(slug);
        if (!isValidSlug(slug)) {
          alert(
            "Slug inválido. Use minúsculas, números e hífens (min 3 chars)."
          );
        } else {
          await fetch("/api/tool-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tool_id: createdOrEdited.id,
              slug,
              content_md: details.content_md || "",
              content_html: details.content_html || "",
            }),
          }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error(err.error || "Erro ao salvar detalhes");
            }
          });
        }
      }

      // reset
      setForm(empty);
      setDetails({ slug: "", content_md: "", content_html: "" });
      setEditingId(null);
      await load();
      alert(editingId ? "Ferramenta atualizada!" : "Ferramenta publicada!");
    } catch (e2) {
      setError(e2.message);
      alert(e2.message);
    }
  };

  const startEdit = (tool) => {
    setEditingId(tool.id);
    setForm({
      title: tool.title,
      description: tool.description,
      imageUrl: tool.imageUrl,
      linkUrl: tool.linkUrl,
      badge: tool.badge || "",
    });
    loadDetails(tool.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
    setDetails({ slug: "", content_md: "", content_html: "" });
  };

  const remove = async (id) => {
    if (!confirm("Excluir esta ferramenta?")) return;
    await deleteTool(id);
    await load();
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="grid gap-8">
      {/* ---------------- FORMULÁRIO ---------------- */}
      <section>
        <h1 className="text-2xl font-bold mb-4">
          {editingId ? "Editar ferramenta" : "Publicar nova ferramenta"}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 bg-white border rounded-2xl p-4"
        >
          {/* TÍTULO */}
          <div className="grid">
            <label className="text-sm text-gray-700">Título*</label>
            <input
              className="rounded-lg border p-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* DESCRIÇÃO */}
          <div className="grid">
            <label className="text-sm text-gray-700">Descrição*</label>
            <textarea
              className="rounded-lg border p-2"
              rows="3"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>

          {/* IMAGEM */}
          <div className="grid">
            <label className="text-sm text-gray-700">
              Imagem da ferramenta
            </label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {form.imageUrl && (
              <div className="mt-2">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-28 rounded-lg border object-cover"
                />
                <div className="text-xs text-gray-500 break-all mt-1">
                  {form.imageUrl}
                </div>
              </div>
            )}
          </div>

          {/* LINK */}
          <div className="grid">
            <label className="text-sm text-gray-700">Link da ferramenta*</label>
            <input
              className="rounded-lg border p-2"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              required
            />
          </div>

          {/* BADGE */}
          <div className="grid">
            <label className="text-sm text-gray-700">Badge (opcional)</label>
            <select
              className="rounded-lg border p-2"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
            >
              <option value="">(sem badge)</option>
              <option value="Novo">Novo</option>
              <option value="Atualizado">Atualizado</option>
            </select>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-2">
            <button className="rounded-xl bg-blue-600 text-white px-4 py-2">
              {editingId ? "Salvar alterações" : "Publicar"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border px-4 py-2"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ---------------- DETALHES ---------------- */}
      <form
        onSubmit={saveDetails}
        className="grid gap-3 bg-white border rounded-2xl p-4"
      >
        <h3 className="text-lg font-semibold">Página de Detalhes</h3>

        {/* SLUG */}
        <div className="grid">
          <label className="text-sm text-gray-700">Slug (URL)</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border p-2"
              placeholder="ex.: calculadora-price"
              value={details.slug}
              onChange={(e) => setDetails({ ...details, slug: e.target.value })}
            />
            <button
              type="button"
              onClick={() =>
                setDetails((d) => ({ ...d, slug: toSlug(form.title) }))
              }
              className="rounded-lg border px-3 py-2 text-sm"
              title="Gerar a partir do título"
            >
              Gerar
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Link final: <code>/detalhes/{details.slug || "<slug>"}</code>
          </div>
        </div>

        {/* EDITOR VISUAL (lazy + Suspense) */}
        <div className="grid mb-8">
          <label className="text-sm text-gray-700">
            Conteúdo (Editor visual)
          </label>
          <Suspense
            fallback={
              <div className="text-gray-400 text-sm">Carregando editor...</div>
            }
          >
            <ReactQuill
              theme="snow"
              value={details.content_html}
              onChange={(html) =>
                setDetails((d) => ({ ...d, content_html: html || "" }))
              }
              modules={quillModules}
              formats={quillFormats}
              className="bg-white rounded-lg"
            />
          </Suspense>
        </div>

        {/* dica quando ainda não existe ferramenta */}
        {!editingId && <p className="text-xs text-gray-500">.</p>}

        {/* botões (somente quando editando) */}
        {editingId && (
          <div className="flex gap-2">
            <button className="rounded-xl bg-blue-600 text-white px-4 py-2">
              Salvar detalhes
            </button>
            {details.slug && (
              <a
                className="rounded-xl border px-4 py-2 text-blue-700 hover:bg-blue-50"
                href={`/detalhes/${toSlug(details.slug)}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir página
              </a>
            )}
          </div>
        )}
      </form>

      {/* ---------------- LISTAGEM ---------------- */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Ferramentas publicadas</h2>

        <ul className="grid gap-3">
          {tools.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 bg-white border rounded-2xl p-3"
            >
              <div className="flex items-center gap-3">
                {t.imageUrl ? (
                  <img
                    src={t.imageUrl}
                    alt=""
                    className="w-16 h-10 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-10 bg-gray-100 rounded-lg" />
                )}

                <div>
                  <div className="font-medium flex items-center gap-2">
                    {t.title}
                    {t.badge && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          t.badge === "Novo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{t.linkUrl}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(t)}
                  className="flex items-center gap-1 rounded-xl border px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition"
                  title="Editar"
                >
                  <Pencil size={16} strokeWidth={2} />
                  Editar
                </button>

                <button
                  onClick={() => remove(t.id)}
                  className="flex items-center gap-1 rounded-xl border px-3 py-1 text-sm text-red-600 hover:bg-red-50 transition"
                  title="Excluir"
                >
                  <Trash2 size={16} strokeWidth={2} />
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
