# LogToHub

Hub de logging multi-plataforma com suporte a Discord, Telegram, Slack e outros serviços.

## Instalação

```bash
npm install logtohub
```

## Uso Básico

```typescript
import { DiscordLogger } from 'logtohub';

// Configurar o logger
const logger = new DiscordLogger({
  token: 'seu-token-do-discord',
  defaultChannelName: 'logs-producao'
});

// Conectar ao Discord
await logger.connect();

// Enviar mensagens de log
await logger.log({
  level: 'error',
  message: 'Erro na API de pagamentos',
  metadata: {
    statusCode: 500,
    error: 'Gateway timeout'
  }
});

// Logs informativos
await logger.log({
  level: 'info',
  message: 'Pedido processado com sucesso',
  metadata: { orderId: '123' }
});

// Logs de alerta
await logger.log({
  level: 'warn',
  message: 'Rate limit próximo do limite',
  metadata: { current: 950, limit: 1000 }
});
```

## Níveis de Log

- `error`: Erros que precisam de atenção imediata
- `warn`: Avisos importantes mas não críticos
- `info`: Informações gerais do sistema
- `debug`: Informações detalhadas para debugging

## Configuração

### Discord Logger

```typescript
const logger = new DiscordLogger({
  token: 'seu-token-do-discord',
  defaultChannelName: 'logs-producao', // opcional, padrão: 'logtohub'
  guildId: 'id-do-servidor', // opcional, usa o primeiro servidor disponível se não especificado
});
```

## Recursos

- ✨ Suporte a múltiplas plataformas
- 🌟 Totalmente tipado (TypeScript)
- 🚀 API simples e intuitiva
- 🔄 Suporte a metadata
- 📊 Múltiplos níveis de log
- 💪 Tratamento robusto de erros

## Próximos Passos

- [ ] Suporte a Telegram
- [ ] Suporte a Slack
- [ ] Suporte a Email
- [ ] Filtros de log por nível
- [ ] Rate limiting configurável
- [ ] Retry em caso de falhas

## Licença

MIT