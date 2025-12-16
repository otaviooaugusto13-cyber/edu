// Dependências
const express = require('express');
const app = express();
const path = require('path');
const { Pool } = require('pg');

// Configurações e Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definindo a porta do servidor
const PORT = process.env.PORT || 5000;

// Configuração Condicional do Banco de Dados PostgreSQL
// Isso garante que o servidor funcione mesmo se a DATABASE_URL estiver ausente ou incorreta.
let pool = null;
if (process.env.DATABASE_URL) {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
        console.log('PostgreSQL: Conexão configurada via DATABASE_URL.');
    } catch (error) {
        console.error('Erro ao configurar Pool de conexão do PostgreSQL:', error.message);
    }
} else {
    console.log('PostgreSQL: DATABASE_URL não encontrada. O Banco de Dados não será usado.');
}

// --- Rota Principal: Serve a Página de Vendas (edu.html) ---
app.get('/', (req, res) => {
    // Servirá o seu arquivo HTML que contém o formulário Formspree/Hotmart
    res.sendFile(path.join(__dirname, 'edu.html')); 
});


// --- Rota de Teste de Conexão com o Banco de Dados (opcional) ---
app.get('/api/teste-db', async (req, res) => {
    if (!pool) {
        return res.status(503).json({
            status: 'warning',
            message: 'Banco de Dados indisponível (DATABASE_URL ausente).'
        });
    }
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
});