# Lovable Automation Platform - TODO

## Autenticação
- [x] Sistema de registro com email e senha
- [x] Sistema de login com email e senha
- [x] Validação de email
- [x] Hash seguro de senhas
- [ ] Recuperação de senha

## Planos de Crédito
- [x] Criar tabela de planos no banco de dados
- [ ] Interface de seleção de planos
- [x] Gerenciamento de saldo de créditos do usuário
- [ ] Diferentes pacotes de créditos (ex: 10, 50, 100, 500 créditos)

## Pagamento PIX
- [x] Integração com API de PIX (Mercado Pago)
- [x] Geração de QR Code para pagamento
- [x] Geração de código Copia e Cola
- [x] Verificação de pagamento recebido
- [ ] Atualização automática de saldo após pagamento confirmado
- [x] Histórico de transações

## Dashboard do Usuário
- [x] Exibição de saldo de créditos atual
- [x] Formulário para submeter link de invite do Lovable
- [x] Campo para quantidade de contas a criar
- [x] Botão para iniciar processamento
- [x] Validação de entrada (link válido, quantidade válida)

## Sistema de Fila de Tarefas
- [x] Criar tabela para armazenar tarefas
- [x] Implementar fila de processamento em background
- [x] Worker para processar tarefas sequencialmente
- [ ] Tratamento de erros e retry automático
- [ ] Timeout para tarefas travadas

## Automação Lovable.dev
- [ ] Instalar e configurar Playwright
- [ ] Criar script para gerar emails temporários válidos
- [ ] Automação de registro no Lovable.dev via link de invite
- [ ] Automação de criação de projeto simples
- [ ] Automação de publicação do projeto
- [ ] Tratamento de erros durante automação
- [ ] Logging detalhado de cada etapa

## Painel de Progresso
- [ ] Exibição em tempo real do progresso de criação
- [ ] Contador de contas criadas vs total
- [ ] Status de cada tarefa (pendente, processando, concluído, erro)
- [ ] Atualização em tempo real (WebSocket ou polling)
- [ ] Pausa/cancelamento de tarefas

## Histórico de Tarefas
- [ ] Tabela com histórico de todas as execuções
- [ ] Filtros por data, status, número de contas
- [ ] Detalhes de cada tarefa (link, quantidade, resultado)
- [ ] Logs de erros para tarefas falhadas
- [ ] Exportação de relatório

## Sistema de Créditos
- [ ] Débito de créditos por tarefa executada
- [ ] Cálculo de custo por conta criada
- [ ] Validação de saldo suficiente antes de processar
- [ ] Reembolso em caso de falha
- [ ] Auditoria de movimentação de créditos

## Design e Interface
- [x] Landing page elegante
- [x] Página de login/registro
- [x] Página de seleção de planos
- [x] Página de pagamento PIX
- [x] Dashboard principal
- [x] Painel de progresso
- [x] Histórico de tarefas
- [ ] Perfil do usuário
- [x] Design responsivo (mobile, tablet, desktop)
- [x] Tema elegante com cores profissionais

## Testes e Validação
- [x] Testes unitários para lógica de créditos
- [ ] Testes de automação Playwright
- [ ] Testes de API de pagamento
- [ ] Testes de fila de tarefas
- [ ] Teste end-to-end completo

## Documentação
- [ ] README com instruções de setup
- [ ] Documentação de API
- [ ] Guia de uso para usuários
- [ ] Documentação de arquitetura


## Fluxo de Compra de Créditos
- [x] Botão "Comprar Créditos" no dashboard
- [x] Página de seleção de planos com cards interativos
- [x] Integração com fluxo de pagamento PIX
- [x] Redirecionamento após pagamento confirmado
- [x] Validação de saldo antes de criar tarefa


## Webhook Mercado Pago
- [x] Endpoint de webhook para receber notificações
- [x] Validação de assinatura do webhook
- [x] Processamento de pagamentos confirmados
- [x] Crédito automático de saldo
- [x] Logging e tratamento de erros
- [x] Testes de webhook
