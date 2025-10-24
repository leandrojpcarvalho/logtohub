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
await logger.start();

// Enviar mensagens de log
logger.log("O usuário não conseguiu logar");

logger.log({
    messagem: "O usuário não conseguiu logar"
});

logger.error("O serviço parou de funcionar")

### getChannel

Você pode pegar uma lista de qualquer canal do servidor com a função, e isso te retornará um canal:


const channel = logger.getChannel("Outro canal fora do bot")

channel.sendMessage("Nova msg no canal!")


## Configuração

### Discord Logger

```typescript
const logger = new DiscordLogger({
  APIToken: 'seu-token-do-discord',
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