# LogToHub

[![npm version](https://img.shields.io/npm/v/logtohub.svg)](https://www.npmjs.com/package/logtohub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hub de logging multi-plataforma com suporte a Discord, Telegram, Slack e outros serviços de mensageria. Ideal para monitoramento de aplicações, notificações de eventos e centralização de logs em ambientes de produção.

## 📦 Instalação

```bash
npm install logtohub
```

## 🚀 Início Rápido

```typescript
import { DiscordLogger } from 'logtohub';

const logger = await DiscordLogger.getInstance({
  APIToken: 'seu-token-do-discord-bot',
});

// Enviar uma mensagem simples
await logger.log({
  message: "Aplicação iniciada com sucesso!"
});
```

## 📖 Uso Detalhado

### Configuração Básica

O LogToHub cria automaticamente dois canais padrão no Discord:
- **Mensagens do bot**: Canal para notificações gerais
- **Mensagens de erro**: Canal dedicado para erros

```typescript
import { DiscordLogger } from 'logtohub';

const logger = await DiscordLogger.getInstance({
  APIToken: 'seu-token-do-discord-bot',
  internalLogs: true, // Exibe logs internos no console (opcional)
});
```

### Configuração Avançada

Você pode criar canais personalizados e especificar a guilda (servidor Discord):

```typescript
import { 
  DiscordLogger, 
  ChannelType, 
  CreateTextChannelProps, 
  defaultBotChannels 
} from 'logtohub';

// Definir canais personalizados
const customChannels: CreateTextChannelProps[] = [
  {
    type: ChannelType.BotNotification,
    name: "Logs de Autenticação",
    description: "Logs relacionados a login e autenticação",
  },
  {
    type: ChannelType.BotError,
    name: "Erros Críticos",
    description: "Erros críticos que requerem atenção imediata",
  },
  {
    type: ChannelType.Common,
    name: "Logs Gerais",
    description: "Logs gerais da aplicação",
  }
];

const logger = await DiscordLogger.getInstance({
  APIToken: 'seu-token-do-discord-bot',
  guildId: 'id-do-seu-servidor-discord', // Opcional: especifica o servidor
  channelBots: [...customChannels, ...defaultBotChannels],
  internalLogs: false, // Desativa logs internos no console
});
```

### Enviando Mensagens

#### Mensagem Simples

```typescript
await logger.log({
  message: "Usuário realizou login com sucesso"
});
```

#### Mensagem em Canal Específico

```typescript
await logger.log({
  message: "Falha ao conectar com o banco de dados",
  channel: "Erros Críticos" // Busca por nome (parcial ou completo)
});

// Ou buscar por tipo
await logger.log({
  message: "Erro de validação",
  channel: { type: ChannelType.BotError }
});

// Ou buscar por nome exato
await logger.log({
  message: "Nova notificação",
  channel: { name: "Logs de Autenticação" }
});
```

#### Mensagens Complexas

O logger aceita diferentes tipos de dados:

```typescript
// String simples
await logger.log({
  message: "Mensagem de texto"
});

// Objeto JSON
await logger.log({
  message: {
    event: "user_login",
    userId: 12345,
    timestamp: new Date().toISOString(),
    ip: "192.168.1.1"
  }
});

// Array
await logger.log({
  message: ["Erro 1", "Erro 2", "Erro 3"]
});
```

### Obtendo Canais

#### Buscar Canal por Nome ou Tipo

```typescript
// Busca por nome (case-insensitive e com suporte a correspondência parcial)
const channel = logger.getChannel("mensagens de erro");

if (channel) {
  await channel.sendMessage("Mensagem direta no canal!");
}

// Busca por tipo
const errorChannel = logger.getChannel(ChannelType.BotError);
```

#### Listar Todos os Canais

```typescript
const allChannels = logger.allChannels; // Map<string, TextChannel>

for (const [name, channel] of allChannels) {
  console.log(`Canal: ${name}, Tipo: ${channel.type}`);
}
```

#### Verificar Status do Logger

```typescript
import { Status } from 'logtohub';

console.log(logger.status); // 'creating' | 'updating' | 'ready'

// Aguardar até que o logger esteja pronto
if (logger.status === Status.READY) {
  await logger.log({ message: "Logger está pronto!" });
}
```

## 🎯 Tipos de Canais

O LogToHub suporta três tipos de canais:

- **`ChannelType.BotNotification`**: Canal para notificações e eventos gerais
- **`ChannelType.BotError`**: Canal dedicado para erros e problemas
- **`ChannelType.Common`**: Canal para mensagens comuns sem classificação específica

### Prioridade de Fallback

Quando uma mensagem é enviada sem especificar o canal, o logger segue esta ordem de prioridade:

1. `BotNotification` (se existir)
2. `BotError` (se existir)
3. `Common` (se existir)

Se nenhum canal estiver disponível, um erro é lançado.

## 🔧 Opções de Configuração

### `PlatformDiscordConstructor`

| Propriedade | Tipo | Obrigatório | Descrição |
|------------|------|-------------|-----------|
| `APIToken` | `string` | ✅ | Token de autenticação do bot Discord |
| `guildId` | `string` | ❌ | ID do servidor Discord (guilda) específico |
| `channelBots` | `CreateTextChannelProps[]` | ❌ | Lista de canais personalizados a serem criados |
| `internalLogs` | `boolean` | ❌ | Habilita logs internos no console (padrão: `false`) |
| `options` | `ClientOptions` | ❌ | Opções do cliente Discord.js |

### `CreateTextChannelProps`

| Propriedade | Tipo | Obrigatório | Descrição |
|------------|------|-------------|-----------|
| `type` | `ChannelType` | ✅ | Tipo do canal (BotNotification, BotError, Common) |
| `name` | `string` | ✅ | Nome do canal |
| `description` | `string` | ❌ | Descrição do canal |
| `isBot` | `boolean` | ❌ | Define se apenas o bot pode enviar mensagens |

## 🛡️ Tratamento de Erros

O LogToHub lança erros customizados (`BotError`) em situações específicas:

```typescript
import { BotError, BotErrorModules } from 'logtohub';

try {
  await logger.log({
    message: "Teste",
    channel: "canal-inexistente"
  });
} catch (error) {
  if (error instanceof BotError) {
    console.error(`[${error.module}] ${error.message}`);
  }
}
```

### Tipos de Erros

- **`BotErrorModules.Instance`**: Erros relacionados à instância do logger
- **`BotErrorModules.Communication`**: Erros de comunicação com a plataforma

## 📝 Exemplos Práticos

### Sistema de Monitoramento

```typescript
import { DiscordLogger, ChannelType } from 'logtohub';

const logger = await DiscordLogger.getInstance({
  APIToken: process.env.DISCORD_BOT_TOKEN!,
  channelBots: [
    {
      type: ChannelType.BotNotification,
      name: "Sistema Online",
      description: "Status do sistema"
    },
    {
      type: ChannelType.BotError,
      name: "Alertas Críticos",
      description: "Erros que requerem ação imediata"
    }
  ]
});

// Monitorar eventos
app.on('error', async (error) => {
  await logger.log({
    message: {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    },
    channel: "Alertas Críticos"
  });
});

app.on('ready', async () => {
  await logger.log({
    message: "🚀 Aplicação iniciada com sucesso!",
    channel: "Sistema Online"
  });
});
```

### Logger com Canal Restrito ao Bot

```typescript
const logger = await DiscordLogger.getInstance({
  APIToken: process.env.DISCORD_BOT_TOKEN!,
  channelBots: [
    {
      type: ChannelType.BotNotification,
      name: "Logs Automaticos",
      description: "Canal apenas para mensagens do bot",
      isBot: true // Apenas o bot pode enviar mensagens
    }
  ]
});
```

## 🗺️ Roadmap

- [ ] Suporte a Telegram
- [ ] Suporte a Slack
- [ ] Suporte a Email
- [ ] Filtros de log por nível (INFO, WARN, ERROR, DEBUG)
- [ ] Rate limiting configurável
- [ ] Sistema de retry automático em caso de falhas
- [ ] Formatação customizável de mensagens
- [ ] Templates de mensagens
- [ ] Buffer de mensagens offline

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

MIT © [Leandro J. P. Carvalho](https://github.com/leandrojpcarvalho)

## 🔗 Links Úteis

- [Documentação Discord.js](https://discord.js.org/)
- [Como criar um bot Discord](https://discord.com/developers/docs/intro)
- [Obter token do bot Discord](https://discord.com/developers/applications)

---

**Nota**: Este pacote está em desenvolvimento ativo. A API pode sofrer alterações até a versão 1.0.0.
