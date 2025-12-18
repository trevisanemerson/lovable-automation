# Guia de Deployment - Lovable Automation

Este guia explica como fazer deploy da aplicação em servidores externos com suporte a Playwright.

## Opção 1: Railway (Recomendado)

Railway é a opção mais fácil e tem suporte nativo a Playwright.

### Passo 1: Criar conta no Railway
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub ou crie uma conta
3. Crie um novo projeto

### Passo 2: Conectar repositório
1. No Railway, clique em "New Project"
2. Selecione "Deploy from GitHub"
3. Selecione seu repositório
4. Railway detectará automaticamente que é uma aplicação Node.js

### Passo 3: Configurar variáveis de ambiente
No painel do Railway, vá para "Variables" e adicione:

```
DATABASE_URL=seu_database_url
JWT_SECRET=seu_jwt_secret
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=seu_oauth_url
VITE_OAUTH_PORTAL_URL=seu_oauth_portal_url
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=seu_nome
BUILT_IN_FORGE_API_KEY=sua_forge_key
BUILT_IN_FORGE_API_URL=sua_forge_url
VITE_FRONTEND_FORGE_API_KEY=sua_frontend_key
VITE_FRONTEND_FORGE_API_URL=sua_frontend_url
MERCADO_PAGO_ACCESS_TOKEN=seu_token_mercado_pago
VITE_APP_TITLE=Lovable Automation
VITE_APP_LOGO=seu_logo_url
```

### Passo 4: Deploy
1. Railway fará deploy automaticamente quando você fizer push no GitHub
2. Você pode acompanhar o progresso no painel
3. Após deploy bem-sucedido, você receberá uma URL pública

### Passo 5: Configurar webhook do Mercado Pago
1. Acesse dashboard do Mercado Pago
2. Vá para Configurações → Webhooks
3. Adicione a URL: `https://seu-dominio-railway.railway.app/api/webhooks/mercadopago`
4. Selecione evento: `payment`

---

## Opção 2: Render

Render também suporta Playwright e oferece free tier.

### Passo 1: Criar conta no Render
1. Acesse [render.com](https://render.com)
2. Faça login com GitHub
3. Crie um novo serviço

### Passo 2: Configurar serviço
1. Selecione "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: lovable-automation
   - **Environment**: Node
   - **Build Command**: `pnpm build`
   - **Start Command**: `node dist/index.js`

### Passo 3: Adicionar variáveis de ambiente
Na seção "Environment", adicione todas as variáveis listadas acima.

### Passo 4: Deploy
Clique em "Create Web Service" e Render fará o deploy automaticamente.

### Passo 5: Configurar webhook
Similar ao Railway, adicione a URL do webhook no Mercado Pago.

---

## Opção 3: Docker (Qualquer servidor)

Se você tem um servidor VPS ou quer usar Docker Compose:

### Passo 1: Build da imagem
```bash
docker build -t lovable-automation:latest .
```

### Passo 2: Executar container
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="seu_database_url" \
  -e JWT_SECRET="seu_jwt_secret" \
  -e MERCADO_PAGO_ACCESS_TOKEN="seu_token" \
  ... (outras variáveis) \
  --name lovable-automation \
  lovable-automation:latest
```

### Passo 3: Docker Compose
Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      MERCADO_PAGO_ACCESS_TOKEN: ${MERCADO_PAGO_ACCESS_TOKEN}
      # ... outras variáveis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Execute com:
```bash
docker-compose up -d
```

---

## Verificar Deploy

Após deploy, teste a aplicação:

```bash
# Verificar se está rodando
curl https://seu-dominio.com/health

# Fazer login
# Acessar dashboard
# Criar uma tarefa de teste
# Verificar se o TaskProcessor está processando
```

---

## Troubleshooting

### Erro: "Chromium not found"
- Certifique-se que está usando Node.js 18+ 
- Railway e Render têm suporte nativo a Playwright
- Se usar VPS, instale: `apt-get install chromium-browser`

### Erro: "Database connection refused"
- Verifique se DATABASE_URL está correto
- Certifique-se que o banco de dados está acessível de fora
- Adicione IP do servidor à whitelist do banco de dados

### TaskProcessor não está processando tarefas
- Verifique logs: `docker logs lovable-automation` (ou painel do Railway/Render)
- Certifique-se que MERCADO_PAGO_ACCESS_TOKEN está configurado
- Verifique se o webhook está registrado no Mercado Pago

---

## Monitoramento

### Railway
- Painel em tempo real com logs
- Métricas de CPU e memória
- Alertas automáticos

### Render
- Logs em tempo real
- Métricas de uso
- Email de alertas

### Docker
Use ferramentas como:
- Prometheus para métricas
- Grafana para visualização
- ELK Stack para logs

---

## Escalabilidade

Se a aplicação crescer:

1. **Aumentar recursos**: CPU e memória no Railway/Render
2. **Usar fila de tarefas**: Bull ou RabbitMQ para processar múltiplas tarefas em paralelo
3. **Cache**: Redis para armazenar dados frequentemente acessados
4. **CDN**: CloudFlare para servir assets estáticos

---

## Suporte

Para problemas:
1. Verifique logs do servidor
2. Teste localmente com `pnpm dev`
3. Verifique variáveis de ambiente
4. Consulte documentação do Railway/Render
