// Servidor Express
const express = require('express');
const app = express();
const path = require('path');
const { Pool } = require('pg');

// Configurações e Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definindo a porta do servidor (usa a porta do Render ou 5000)
const PORT = process.env.PORT || 5000;

// Configuração do Banco de Dados PostgreSQL (usando a variável de ambiente do Render)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para conexões com o Render
    }
});

// --- Rota Principal: Serve a Página de Vendas Corrigida ---
// O arquivo edu.html utiliza o Formspree e Hotmart, não precisando de rotas de backend adicionais.
app.get('/', (req, res) => {
    // Certifique-se de que o arquivo HTML funcional está na sua pasta como "edu.html"
    res.sendFile(path.join(__dirname, 'edu.html')); 
});


// --- Rota de Teste de Conexão com o Banco de Dados ---
// Mantida para garantir que a variável DATABASE_URL está correta no Render
app.get('/api/teste-db', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({
            status: 'success',
            message: 'Conexão com o banco de dados OK!',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao conectar ao PostgreSQL:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Falha na conexão com o banco de dados.',
            details: `Conexão com o banco de dados falhou: ${error.message}`
        });
    }
});


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Acesse a aplicação em: http://localhost:${PORT}`);
});