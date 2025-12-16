// Importações de módulos essenciais
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');

// Configuração do Express
const app = express();

// O Render injeta automaticamente a porta em process.env.PORT
const PORT = process.env.PORT || 3000; 

// --- Variáveis de Ambiente do Render ---
// Obtidas de forma segura do seu ambiente no Render
const DATABASE_URL = process.env.DATABASE_URL; 
const STRIPE_SECRET = process.env.STRIPE_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const JWT_SECRET = process.env.JWT_SECRET;
// ----------------------------------------

// Configuração do PostgreSQL
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        // Isso é crucial para conectar ao Postgres do Render
        rejectUnauthorized: false
    }
});

// Middlewares
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// Middleware para permitir acesso de outros domínios (CORS) - Se precisar
// const cors = require('cors');
// app.use(cors());

// =======================================================
// 1. ROTA RAIZ (PÁGINA INICIAL)
// Serve o arquivo eduard.html para corrigir o erro "Cannot GET /"
// =======================================================
app.get('/', (req, res) => {
    // Servindo o arquivo 'eduard.html' que está no seu repositório
    res.sendFile(path.join(__dirname, 'eduard.html')); 
});

// =======================================================
// 2. EXEMPLO DE ROTA DE API
// Use esta rota como base para suas rotas de login, cadastro, etc.
// =======================================================
app.get('/api/teste-db', async (req, res) => {
    try {
        // Exemplo: Conectar e fazer uma consulta simples
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()'); // Consulta simples para testar a conexão
        client.release();

        res.status(200).json({
            status: 'success',
            message: 'Conexão com o banco de dados OK!',
            timestamp: result.rows[0].now
        });

    } catch (err) {
        console.error("Erro ao conectar ou consultar o banco de dados:", err);
        res.status(500).json({
            status: 'error',
            message: 'Falha na conexão com o banco de dados.',
            details: err.message
        });
    }
});

// =======================================================
// 3. EXEMPLO DE USO DAS CHAVES DO STRIPE
// Apenas para mostrar que a variável está acessível
// =======================================================
app.get('/api/stripe-config', (req, res) => {
    res.status(200).json({
        stripe_key_accessible: !!STRIPE_SECRET, // Retorna true se a chave estiver definida
        price_id: STRIPE_PRICE_ID,
        // Atenção: Nunca exponha a STRIPE_SECRET em produção!
    });
});


// =======================================================
// INICIALIZAÇÃO DO SERVIDOR
// =======================================================
app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
    console.log(`URL da aplicação: ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}`);
});