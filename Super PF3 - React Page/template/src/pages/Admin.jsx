import { useEffect, useState } from "react";
import { getTools, createTool, updateTool, deleteTool } from "../api";
import { Pencil, Trash2 } from "lucide-react";
const empty = {
  title: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  badge: "",
};

export default function Admin() {
  const [tools, setTools] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  // 🔹 Carregar ferramentas
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

  // 🔹 Upload de imagem
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

  // 🔹 Enviar formulário (criar ou editar)
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

      if (editingId) {
        await updateTool(editingId, payload);
      } else {
        await createTool(payload);
      }

      setForm(empty);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  // 🔹 Iniciar edição
  const startEdit = (tool) => {
    setEditingId(tool.id);
    setForm({
      title: tool.title,
      description: tool.description,
      imageUrl: tool.imageUrl,
      linkUrl: tool.linkUrl,
      badge: tool.badge || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🔹 Cancelar edição
  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
  };

  // 🔹 Excluir ferramenta
  const remove = async (id) => {
    if (!confirm("Excluir esta ferramenta?")) return;
    await deleteTool(id);
    await load();
  };

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

          {/* 🏷️ BADGE */}
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
