const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

// ===============================
// Configurações iniciais
// ===============================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Caminho do banco de dados SQLite
const dbFile = path.join(__dirname, "db.sqlite");
const db = new sqlite3.Database(dbFile);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// ===============================
// Configuração do multer (upload)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// ===============================
// Endpoint para upload de imagens
// ===============================
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ===============================
// Criação da tabela (se não existir)
// ===============================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT,
      linkUrl TEXT NOT NULL,
      badge TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Dados de exemplo (só se o banco estiver vazio)
  db.get("SELECT COUNT(*) as cnt FROM tools", (err, row) => {
    if (err) return console.error(err);

    if (row && row.cnt === 0) {
      const stmt = db.prepare(
        "INSERT INTO tools (title, description, imageUrl, linkUrl, badge) VALUES (?,?,?,?,?)"
      );

      stmt.run(
        "Calculadora PRICE",
        "Amortizações crescente/decrescente/linear com antecipação parcial.",
        "https://picsum.photos/seed/price/800/450",
        "https://exemplo.bb/price",
        "Novo"
      );

      stmt.run(
        "Dashboard Inadimplência",
        "KPIs de atraso por prefixo, agência e produto.",
        "https://picsum.photos/seed/inad/800/450",
        "https://exemplo.bb/inadimplencia",
        "Atualizado"
      );

      stmt.run(
        "Catálogo Super PF3",
        "Página com todas as ferramentas do Núcleo.",
        "https://picsum.photos/seed/catalogo/800/450",
        "https://exemplo.bb/catalogo",
        null
      );

      stmt.finalize();
      console.log("🧩 Dados iniciais inseridos com sucesso!");
    }
  });
});

// ===============================
// Rotas da API
// ===============================

// Teste rápido
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Listar todas as ferramentas
app.get("/api/tools", (req, res) => {
  db.all("SELECT * FROM tools ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Buscar ferramenta por ID
app.get("/api/tools/:id", (req, res) => {
  db.get("SELECT * FROM tools WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

// Criar nova ferramenta
app.post("/api/tools", (req, res) => {
  const { title, description, imageUrl, linkUrl, badge } = req.body;

  if (!title || !description || !linkUrl) {
    return res
      .status(400)
      .json({ error: "title, description e linkUrl são obrigatórios" });
  }

  const sql =
    "INSERT INTO tools (title, description, imageUrl, linkUrl, badge) VALUES (?,?,?,?,?)";

  db.run(
    sql,
    [title, description, imageUrl || "", linkUrl, badge || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get("SELECT * FROM tools WHERE id = ?", [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        console.log(
          `✅ Nova ferramenta criada: ${title} (${badge || "sem badge"})`
        );
        res.status(201).json(row);
      });
    }
  );
});

// Atualizar ferramenta existente
app.put("/api/tools/:id", (req, res) => {
  const { title, description, imageUrl, linkUrl, badge } = req.body;
  const id = req.params.id;

  const sql = `
    UPDATE tools
    SET title=?, description=?, imageUrl=?, linkUrl=?, badge=?
    WHERE id=?;
  `;

  db.run(
    sql,
    [title, description, imageUrl || "", linkUrl, badge || null, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Ferramenta não encontrada" });

      db.get("SELECT * FROM tools WHERE id = ?", [id], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        console.log(
          `🛠️ Ferramenta atualizada: ${title} (${badge || "sem badge"})`
        );
        res.json(row);
      });
    }
  );
});

// Deletar ferramenta
app.delete("/api/tools/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM tools WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Not found" });
    console.log(`🗑️ Ferramenta ID ${id} excluída`);
    res.status(204).end();
  });
});

// ===============================
// Inicialização do servidor
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
