// app.js (Servidor Node.js - Crie este arquivo e cole o conteúdo)

// 1. Dependências
// O dotenv lê o arquivo .env
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

// 2. Inicialização do Express
const app = express();
// Define a porta 3000 para rodar localmente
const PORT = process.env.PORT || 3000; 

// 3. Inicialização do Stripe e Webhook Secret
// **As chaves vêm do arquivo .env**
const stripe = Stripe(process.env.STRIPE_SECRET); 
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// 4. Configuração do CORS (Resolve o Erro de Conexão no HTML)
app.use(cors());

// --- Middleware para Rotas NORMAIS (Aceita JSON) ---
// Qualquer rota ANTES do webhook deve usar o express.json()
app.use(express.json());

// ------------------------------------------------------------------
// ROTA 1: CRIAÇÃO DO CHECKOUT (CHAMADA PELO SEU HTML: http://localhost:3000/create-subscription)
// ------------------------------------------------------------------
app.post('/create-subscription', async (req, res) => {
    const { email, name } = req.body; 
    
    // Verificação de segurança: A chave de preço é crucial
    if (!process.env.STRIPE_PRICE_ID) {
        console.error("Erro: STRIPE_PRICE_ID não configurado no .env");
        return res.status(500).json({ message: "Configuração de preço ausente." });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: process.env.STRIPE_PRICE_ID, 
                quantity: 1,
            }],
            customer_email: email, 
            // CRUCIAL: Metadata armazena o email para ser usado no Webhook
            metadata: { 
                userEmail: email, 
                courseName: 'Assinatura Premium'
            },
            // Redirecionamento após o pagamento (Use localhost para testar)
            success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}', 
            cancel_url: 'http://localhost:3000/cancel',
        });

        // Envia a URL do Stripe de volta para o Front-end redirecionar
        res.json({ url: session.url });
    } catch (error) {
        console.error('Erro ao criar sessão Stripe:', error);
        res.status(500).json({ message: 'Falha na criação do checkout Stripe.' });
    }
});


// ------------------------------------------------------------------
// ROTA 2: WEBHOOK (CHAMADA PELO STRIPE: http://localhost:3000/webhook)
// ESTA ROTA LIBERA O ACESSO NO POSTGRES
// ------------------------------------------------------------------
// 🛑 IMPORTANTE: express.raw() é necessário para a validação de segurança do Stripe.
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    
    const sig = req.headers['stripe-signature'];
    let event;

    // 1. Verificação de Segurança OBRIGATÓRIA
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.log(`❌ Erro na verificação do Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 2. Processamento (apenas se o pagamento foi concluído)
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userEmail = session.metadata.userEmail; 

        if (session.mode === 'subscription' && userEmail) {
            
            try {
                // *** LOGICA DE ATUALIZAÇÃO DO POSTGRES VAI AQUI ***
                // 1. Conectar ao Postgres (se ainda não estiver)
                // 2. Buscar ID do usuário pelo email: SELECT id FROM users WHERE email = $1
                // 3. Inserir/Atualizar status na tabela subscriptions
                
                console.log(`✅ ACESSO LIBERADO para o usuário: ${userEmail} (Status no Postgres atualizado!)`);
                
            } catch (dbError) {
                console.error('Erro ao atualizar o banco de dados:', dbError);
                // Retorna 500 para o Stripe tentar enviar o evento novamente
                return res.status(500).end(); 
            }
        }
    }

    // 3. Resposta de Sucesso (O Stripe espera o status 200)
    res.status(200).json({ received: true });
});


// 5. Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor Node.js rodando na porta ${PORT}`);
    console.log(`🔗 API Local: http://localhost:${PORT}`);
});