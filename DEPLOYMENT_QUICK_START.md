# Quick Start - Deployment

## Resumo Rápido

A aplicação está pronta para deployment. Escolha uma das opções abaixo:

### 🚀 Opção 1: Railway (Recomendado)

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project" → "Deploy from GitHub"
3. Selecione seu repositório
4. Railway detectará automaticamente e fará deploy
5. Adicione as variáveis de ambiente no painel
6. Pronto! Sua aplicação estará rodando

**Vantagens:**
- Suporte nativo a Playwright
- Fácil de usar
- Free tier disponível
- Logs em tempo real

### 🎯 Opção 2: Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - Build: `pnpm build`
   - Start: `node dist/index.js`
5. Adicione variáveis de ambiente
6. Deploy!

**Vantagens:**
- Suporte a Docker
- Escalável
- Bom uptime

### 🐳 Opção 3: Docker (VPS/Servidor próprio)

```bash
# Build
docker build -t lovable-automation .

# Run
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e MERCADO_PAGO_ACCESS_TOKEN="..." \
  lovable-automation
```

---

## Variáveis de Ambiente Necessárias

Todas essas variáveis já estão configuradas no seu projeto Manus:

- `DATABASE_URL` - Conexão do banco de dados
- `JWT_SECRET` - Chave de sessão
- `MERCADO_PAGO_ACCESS_TOKEN` - Token do Mercado Pago (você forneceu)
- `VITE_APP_ID` - ID da aplicação
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- Outras variáveis Manus...

**Copie essas variáveis do painel Manus para o servidor de deployment.**

---

## Após Deploy

1. **Teste a aplicação**
   ```bash
   curl https://seu-dominio.com/health
   ```

2. **Configure webhook do Mercado Pago**
   - Acesse dashboard do Mercado Pago
   - Vá para Configurações → Webhooks
   - Adicione: `https://seu-dominio.com/api/webhooks/mercadopago`
   - Evento: `payment`

3. **Teste o fluxo completo**
   - Crie uma tarefa no dashboard
   - Verifique se o TaskProcessor está processando
   - Valide se os créditos foram debitados

---

## Troubleshooting

### "Chromium not found"
- Railway e Render têm suporte nativo
- Se usar VPS, instale: `apt-get install chromium-browser`

### "Database connection refused"
- Verifique DATABASE_URL
- Adicione IP do servidor à whitelist do banco

### "TaskProcessor não processa"
- Verifique logs do servidor
- Certifique-se que MERCADO_PAGO_ACCESS_TOKEN está correto
- Verifique webhook do Mercado Pago

---

## Próximos Passos

1. ✅ Escolher plataforma de deployment
2. ✅ Fazer deploy
3. ✅ Configurar webhook do Mercado Pago
4. ✅ Testar fluxo completo
5. ✅ Compartilhar com usuários!

**Dúvidas?** Consulte `DEPLOYMENT.md` para guia completo.
