export async function getTools() {
  const res = await fetch("/api/tools");
  if (!res.ok) throw new Error("Erro ao buscar ferramentas");
  return res.json();
}

export async function createTool(payload) {
  const res = await fetch("/api/tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erro ao criar");
  return res.json();
}

export async function updateTool(id, payload) {
  const res = await fetch(`/api/tools/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erro ao atualizar");
  return res.json();
}

export async function deleteTool(id) {
  const res = await fetch(`/api/tools/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir");
}
