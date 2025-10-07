const express = require('express');
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json()); // permite receber JSON no body
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aK3mgp1nZJND@ep-proud-fire-acuievu5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

app.listen(8080, () => {
    console.log("🚀 Servidor rodando na porta 8080");
});

// 📦 Buscar todos os pedidos
app.get("/pedidos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM pedidos");
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
        res.status(500).json({ erro: "Erro ao buscar pedidos" });
    }
});

// 📝 Criar um novo pedido e retornar o ID
app.post("/pedidos", async (req, res) => {
    const { tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO pedidos (tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`, // 🔥 retorna o ID do novo pedido
            [tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco]
        );

        const pedidoId = result.rows[0].id; // pega o ID retornado
        res.json({
            sucesso: true,
            mensagem: "Pedido criado com sucesso!",
            id: pedidoId
        });
    } catch (err) {
        console.error("Erro ao criar pedido:", err);
        res.status(500).json({ sucesso: false, erro: "Erro ao criar pedido." });
    }
});

// ❌ Cancelar pedido
app.post("/pedidos/:id/cancelar", async (req, res) => {
    const { id } = req.params;
    const { mensagem } = req.body;

    try {
        await pool.query("UPDATE pedidos SET status = 'cancelado' WHERE id = $1", [id]);
        console.log(`Pedido ${id} cancelado. Mensagem ao cliente: ${mensagem}`);
        res.json({ sucesso: true });
    } catch (err) {
        console.error("Erro ao cancelar pedido:", err);
        res.status(500).json({ sucesso: false });
    }
});

// ✅ Aceitar pedido (com preço e tempo)
app.post("/pedidos/:id/aceitar", async (req, res) => {
    const { id } = req.params;
    const { preco, tempo } = req.body;

    try {
        await pool.query(
            "UPDATE pedidos SET status = 'aceito', preco = $1, tempo_entrega = $2 WHERE id = $3",
            [preco, tempo, id]
        );

        console.log(`Pedido ${id} aceito. Preço: ${preco}, Tempo: ${tempo}min`);
        res.json({ sucesso: true });
    } catch (err) {
        console.error("Erro ao aceitar pedido:", err);
        res.status(500).json({ sucesso: false });
    }
});
