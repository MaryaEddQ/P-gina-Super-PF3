// ===============================
// Imports e inicialização
// ===============================
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

// Ativa chaves estrangeiras no SQLite
db.run("PRAGMA foreign_keys = ON");

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
// Criação das tabelas (se não existirem)
// ===============================
db.serialize(() => {
  // Tabela principal
  db.run(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT,
      linkUrl TEXT NOT NULL,
      badge TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de detalhes (1:1 com tools)
  db.run(`
    CREATE TABLE IF NOT EXISTS tool_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      owner TEXT,
      owner_contact TEXT,
      update_schedule TEXT,
      data_source TEXT,
      data_source_url TEXT,
      access_requirements TEXT,
      tags TEXT,
      content_md TEXT,
      changelog_md TEXT,
      content_html TEXT,
      changelog_html TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tool_id) REFERENCES tools(id)
    )
  `);
  db.run(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_details_slug ON tool_details(slug)`
  );

  // Inserção inicial
  db.get("SELECT COUNT(*) as cnt FROM tools", (err, row) => {
    if (err) return console.error(err);

    if (row && row.cnt === 0) {
      const stmt = db.prepare(
        "INSERT INTO tools (title, category, description, imageUrl, linkUrl, badge) VALUES (?,?,?,?,?,?)"
      );

      stmt.run(
        "Calculadora PRICE",
        "Agro",
        "Amortizações crescente/decrescente/linear com antecipação parcial.",
        "https://picsum.photos/seed/price/800/450",
        "https://exemplo.bb/price",
        "Novo"
      );

      stmt.run(
        "Dashboard Inadimplência",
        "Agro",
        "KPIs de atraso por prefixo, agência e produto.",
        "https://picsum.photos/seed/inad/800/450",
        "https://exemplo.bb/inadimplencia",
        "Atualizado"
      );

      stmt.run(
        "Catálogo Super PF3",
        "Agro",
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

// Listar todas as ferramentas (com slug se existir)
app.get("/api/tools", (req, res) => {
  const sql = `
    SELECT t.*, td.slug AS detailsSlug
    FROM tools t
    LEFT JOIN tool_details td ON td.tool_id = t.id
    ORDER BY t.id DESC
  `;
  db.all(sql, [], (err, rows) => {
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
  const { title, category, description, imageUrl, linkUrl, badge } = req.body;

  if (!title || !description || !linkUrl) {
    return res
      .status(400)
      .json({ error: "title, description e linkUrl são obrigatórios" });
  }

  const sql =
    "INSERT INTO tools (title, category, description, imageUrl, linkUrl, badge) VALUES (?,?,?,?,?,?)";

  db.run(
    sql,
    [title, category, description, imageUrl || "", linkUrl, badge || null],
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
  const { title, category, description, imageUrl, linkUrl, badge } = req.body;
  const id = req.params.id;

  const sql = `
    UPDATE tools
    SET title=?, category=?, description=?, imageUrl=?, linkUrl=?, badge=?
    WHERE id=?;
  `;

  db.run(
    sql,
    [title, category, description, imageUrl || "", linkUrl, badge || null, id],
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

// Deletar ferramenta (apaga detalhes antes)
app.delete("/api/tools/:id", (req, res) => {
  const id = req.params.id;

  db.serialize(() => {
    // 1) apaga detalhes vinculados (se existirem)
    db.run("DELETE FROM tool_details WHERE tool_id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 2) apaga a ferramenta em si
      db.run("DELETE FROM tools WHERE id = ?", [id], function (err2) {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Not found" });
        }

        console.log(`🗑️ Ferramenta ID ${id} e detalhes (se houver) excluídos`);
        res.status(204).end();
      });
    });
  });
});

// ===============================
// CRUD de detalhes das ferramentas
// ===============================
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

// Inserir ou atualizar detalhes (upsert)
app.post("/api/tool-details", (req, res) => {
  let {
    tool_id,
    slug,
    owner,
    owner_contact,
    update_schedule,
    data_source,
    data_source_url,
    access_requirements,
    tags,
    content_md,
    changelog_md,
    content_html,
    changelog_html,
  } = req.body;

  if (!tool_id) return res.status(400).json({ error: "tool_id é obrigatório" });

  slug = toSlug(slug || "");
  if (!isValidSlug(slug)) {
    return res.status(400).json({
      error: "Slug inválido. Use minúsculas, números e hífens (min 3 chars).",
    });
  }

  const updateSql = `
    UPDATE tool_details
       SET slug=?, owner=?, owner_contact=?, update_schedule=?, data_source=?,
           data_source_url=?, access_requirements=?, tags=?, content_md=?, changelog_md=?,
           content_html=?, changelog_html=?, updated_at=CURRENT_TIMESTAMP
     WHERE tool_id=?;
  `;

  db.run(
    updateSql,
    [
      slug,
      owner,
      owner_contact,
      update_schedule,
      data_source,
      data_source_url,
      access_requirements,
      tags,
      content_md,
      changelog_md,
      content_html,
      changelog_html,
      tool_id,
    ],
    function (err) {
      if (err) {
        if (
          String(err.message).includes(
            "UNIQUE constraint failed: tool_details.slug"
          )
        ) {
          return res.status(409).json({ error: "Slug já está em uso" });
        }
        return res.status(500).json({ error: err.message });
      }

      if (this.changes > 0) {
        return db.get(
          "SELECT * FROM tool_details WHERE tool_id=?",
          [tool_id],
          (e2, row) => {
            if (e2) return res.status(500).json({ error: e2.message });
            return res.json(row);
          }
        );
      }

      const insertSql = `
        INSERT INTO tool_details
          (tool_id, slug, owner, owner_contact, update_schedule, data_source,
           data_source_url, access_requirements, tags, content_md, changelog_md,
           content_html, changelog_html)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      db.run(
        insertSql,
        [
          tool_id,
          slug,
          owner,
          owner_contact,
          update_schedule,
          data_source,
          data_source_url,
          access_requirements,
          tags,
          content_md,
          changelog_md,
          content_html,
          changelog_html,
        ],
        function (e3) {
          if (e3) {
            if (
              String(e3.message).includes(
                "UNIQUE constraint failed: tool_details.slug"
              )
            ) {
              return res.status(409).json({ error: "Slug já está em uso" });
            }
            return res.status(500).json({ error: e3.message });
          }
          db.get(
            "SELECT * FROM tool_details WHERE id=?",
            [this.lastID],
            (e4, row) => {
              if (e4) return res.status(500).json({ error: e4.message });
              return res.status(201).json(row);
            }
          );
        }
      );
    }
  );
});

// Buscar detalhes por tool_id (para o Admin)
app.get("/api/tool-details/by-tool/:toolId", (req, res) => {
  db.get(
    "SELECT * FROM tool_details WHERE tool_id=?",
    [req.params.toolId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || null);
    }
  );
});

// Página de detalhes por slug (para o site)
app.get("/api/tool-details/:slug", (req, res) => {
  const slug = req.params.slug;
  const sql = `
    SELECT
      t.id AS toolId,
      t.title,
      t.description,
      t.imageUrl,
      t.linkUrl,
      t.badge,
      td.id AS detailsId,
      td.slug,
      td.owner,
      td.owner_contact,
      td.update_schedule,
      td.data_source,
      td.data_source_url,
      td.access_requirements,
      td.tags,
      td.content_md,
      td.changelog_md,
      td.content_html,
      td.changelog_html,
      td.updated_at
    FROM tool_details td
    JOIN tools t ON t.id = td.tool_id
    WHERE td.slug = ?
  `;
  db.get(sql, [slug], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row)
      return res.status(404).json({ error: "Detalhes não encontrados" });
    res.json(row);
  });
});

// ===============================
// Inicialização do servidor
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
