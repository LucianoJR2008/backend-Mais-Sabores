const express = require('express')
const { Pool } = require("pg")

const app = express()
const cors = require("cors")
app.use(express.json()) // permite receber JSON no body
app.use(express.urlencoded({ extended: true }))
app.use(cors())
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_aK3mgp1nZJND@ep-proud-fire-acuievu5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
})

app.listen(8080, () => {
    console.log("o servidor foi aberto")
})

app.get("/pedidos", async (req, res)=>{
    const result = await pool.query("SELECT * FROM pedidos")
    res.json(result.rows)
})

app.post("/pedidos", async (req, res) => {
  const { tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco } = req.body;

  const result = await pool.query(
    "INSERT INTO pedidos (tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
    [tamanho, sabor, refrigerante, borda, tipo, sabor1, sabor2, endereco]
  );

  res.json(result.rows[0]); // retorna o pedido criado com o ID
});


// Atualizar status para "cancelado"
app.post("/pedidos/:id/cancelar", async (req, res) => {
  const { id } = req.params;
  const { mensagem } = req.body;

  await pool.query("UPDATE pedidos SET status = 'cancelado' WHERE id = $1", [id]);

  console.log(`Pedido ${id} cancelado. Mensagem ao cliente: ${mensagem}`);

  res.json({ sucesso: true });
});

// Atualizar status para "aceito" + adicionar preço e tempo
app.post("/pedidos/:id/aceitar", async (req, res) => {
  const { id } = req.params;
  const { preco, tempo } = req.body;

  await pool.query(
    "UPDATE pedidos SET status = 'aceito', preco = $1, tempo_entrega = $2 WHERE id = $3",
    [preco, tempo, id]
  );

  console.log(`Pedido ${id} aceito. Preço: ${preco}, Tempo: ${tempo}min`);
  res.json({ sucesso: true });
});
