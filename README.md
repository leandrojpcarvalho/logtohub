# LogToHub

Hub de logging multi-plataforma com suporte a Discord, Telegram, Slack e outros serviços.

## Instalação

```bash
npm install logtohub
```

## Uso Básico

```typescript
import { DiscordLogger, ChannelType, CreateTextChannelProps, defaultBotChannels  } from 'logtohub';

// 
const testBotChannel: CreateTextChannelProps = {
  type: ChannelType.BotNotification,
  name: "Meu novo canal",
  description: "Teste dos canais do discord",
};


// Configurar o logger
const logger = await  DiscordLogger.getInstance({
  APIToken: 'token do bot',
  // se não passar terá 2 canais default, que também podem ser importados com exemplo
  channels: [testBotChannel, ...defaultBotChannels]
});

// Enviar mensagens de log
logger.log({
  messagem: "pela sequência > notification > error > common"
});

logger.log({
    messagem: "O usuário não conseguiu logar",
    // caso o canal não seja encontrado tentará postar no canal de erro, caso não exista um definido vai para notifcation.
    channel: "nome do canal, ou parte"
});


### getChannel

Você pode pegar uma lista de qualquer canal do servidor com a função, e isso te retornará um canal:


const channel = logger.getChannel("Outro canal fora do bot")

channel.sendMessage("Nova msg no canal!")

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