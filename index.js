// =========================
//  BACKEND COMPLETO
// =========================

import express from "express";
import cors from "cors";
import pkg from "pg";
import multer from "multer";

const { Pool } = pkg;
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// =========================
//  CONEXÃO COM O NEON
// =========================
const pool = new Pool({
    connectionString: "COLE_AQUI_SUA_DATABASE_URL_DO_NEON",
    ssl: { rejectUnauthorized: false }
});

// =========================
//  CONFIGURAR UPLOAD (multer)
// =========================
const upload = multer();

// =========================
//  ROTAS DE PEDIDOS
// =========================

// Criar pedido
app.post("/pedidos", async (req, res) => {
    try {
        const {
            tamanho, sabor, refrigerante, borda,
            tipo, sabor1, sabor2, endereco,
            quantidade, preco, tempo_entrega
        } = req.body;

        const result = await pool.query(
            `INSERT INTO pedidos 
            (tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco,
            quantidade, preco, tempo_entrega, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pendente')
            RETURNING id`,
            [tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco,
            quantidade, preco, tempo_entrega]
        );

        res.json({ sucesso: true, id: result.rows[0].id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ sucesso: false });
    }
});

// Listar pedidos
app.get("/pedidos", async (req, res) => {
    const result = await pool.query("SELECT * FROM pedidos ORDER BY id DESC");
    res.json(result.rows);
});

// Buscar pedido por ID (para página de status)
app.get("/pedidos/:id", async (req, res) => {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM pedidos WHERE id = $1", [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ erro: "Pedido não encontrado" });
    }

    res.json(result.rows[0]);
});

// Alterar status do pedido
app.patch("/pedidos/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
        "UPDATE pedidos SET status = $1 WHERE id = $2",
        [status, id]
    );

    res.json({ sucesso: true });
});

// Enviar mensagem ao cliente (usado no painel admin)
app.post("/pedidos/:id/mensagem", async (req, res) => {
    const { id } = req.params;
    const { mensagem } = req.body;

    console.log(`Mensagem para o cliente do pedido ${id}: ${mensagem}`);

    res.json({ sucesso: true });
});

// =========================
//  ROTAS DE SUGESTÕES
// =========================

// Enviar sugestão
app.post("/sugestoes", async (req, res) => {
    const { texto } = req.body;

    await pool.query("INSERT INTO sugestoes (texto) VALUES ($1)", [texto]);

    res.json({ sucesso: true });
});

// Listar sugestões
app.get("/sugestoes", async (req, res) => {
    const result = await pool.query("SELECT * FROM sugestoes ORDER BY id DESC");
    res.json(result.rows);
});

// =========================
//  ROTAS DO CARDÁPIO
// =========================

// Upload da imagem do cardápio
app.post("/admin/upload-cardapio", upload.single("imagemCardapio"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ sucesso: false, mensagem: "Nenhuma imagem enviada" });
        }

        const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

        await pool.query(
            "UPDATE configuracoes SET imagem_cardapio_url = $1 WHERE id = 1",
            [base64]
        );

        res.json({ sucesso: true, url: base64 });

    } catch (error) {
        console.error(error);
        res.status(500).json({ sucesso: false });
    }
});

// Buscar imagem do cardápio
app.get("/configuracoes/cardapio-url", async (req, res) => {
    const result = await pool.query("SELECT imagem_cardapio_url FROM configuracoes WHERE id = 1");

    res.json({ url: result.rows[0]?.imagem_cardapio_url || null });
});

// =========================
//  RODAR SERVIDOR
// =========================
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
