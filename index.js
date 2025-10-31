const express = require('express');
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json()); // permite receber JSON no body
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 🗃️ Conexão com o banco Neon
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aK3mgp1nZJND@ep-proud-fire-acuievu5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

// 🚀 Iniciar servidor
app.listen(8080, () => {
    console.log("✅ O servidor foi aberto na porta 8080");
});


// 📦 Buscar todos os pedidos
app.get("/pedidos", async (req, res) => {
    const result = await pool.query("SELECT * FROM pedidos");
    res.json(result.rows);
});


// 📝 Criar um novo pedido
app.post("/pedidos", async (req, res) => {
    const { tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco } = req.body;

    await pool.query(
        "INSERT INTO pedidos (tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco]
    );

    res.send("🍕 Obrigado pelo pedido!");
});


// ❌ Cancelar pedido
app.post("/pedidos/:id/cancelar", async (req, res) => {
    const { id } = req.params;
    const { mensagem } = req.body;

    await pool.query("UPDATE pedidos SET status = 'cancelado' WHERE id = $1", [id]);
    console.log(`❌ Pedido ${id} cancelado. Mensagem: ${mensagem}`);

    res.json({ sucesso: true });
});


// ✅ Aceitar pedido (com preço e tempo)
app.post("/pedidos/:id/aceitar", async (req, res) => {
    const { id } = req.params;
    const { preco, tempo } = req.body;

    await pool.query(
        "UPDATE pedidos SET status = 'aceito', preco = $1, tempo_entrega = $2 WHERE id = $3",
        [preco, tempo, id]
    );

    console.log(`✅ Pedido ${id} aceito. Preço: ${preco}, Tempo: ${tempo}min`);
    res.json({ sucesso: true });
});


// 💡 Enviar sugestão
app.post("/sugestoes", async (req, res) => {  // <- CORRIGIDO: o nome da rota estava errado e sem a barra "/"
    const { texto } = req.body;

    if (!texto || texto.trim() === "") {
        return res.status(400).json({ error: "Digite uma sugestão válida!" }); // <- CORRIGIDO: não existe "return.res"
    }

    try {
        await pool.query("INSERT INTO sugestoes (texto) VALUES ($1)", [texto]);
        res.json({ message: "💬 Sugestão enviada com sucesso!" });
    } catch (error) {
        console.error("Erro ao inserir sugestão:", error);
        res.status(500).json({ error: "Erro ao salvar sugestão no banco." });
    }
});


// 🔍 Listar sugestões (admin/teste)
app.get("/sugestoes", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sugestoes ORDER BY criado_em DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
        res.status(500).json({ error: "Erro ao buscar sugestões." });
    }
});
