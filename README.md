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

### Telegram

O LogToHub também suporta Telegram, usando tópicos de fórum para organizar os canais de log.

**Importante:** O grupo do Telegram precisa ter **Tópicos (forum)** habilitados e o bot precisa ser **administrador**.

```typescript
import { TelegramLogger } from 'logtohub';

const logger = await TelegramLogger.getInstance({
  APIToken: 'seu-token-do-bot-telegram',
  guildId: 'id-do-grupo-telegram',
});

// Enviar uma mensagem
await logger.log({
  message: "Aplicação iniciada com sucesso!"
});
```

#### Configuração de Canais

```typescript
const logger = await TelegramLogger.getInstance({
  APIToken: process.env.TELEGRAM_BOT_TOKEN!,
  guildId: process.env.TELEGRAM_GROUP_ID!,
  channelBots: [
    {
      type: ChannelType.BotNotification,
      name: "Logs Gerais",
      description: "Logs gerais da aplicação",
    },
    {
      type: ChannelType.BotError,
      name: "Erros Críticos",
      description: "Erros que requerem ação imediata",
    }
  ]
});
```

#### Destruindo a Instância

```typescript
await logger.destroy();
```

#### Armazenamento Customizado

Por padrão, o TelegramLogger usa um arquivo local para persistir os mapeamentos de tópicos. Você pode implementar seu próprio armazenamento:

```typescript
interface TelegramMemory {
  addTopic(topicName: string, topicId: number): Promise<void>;
  getAllTopics(): Promise<Record<number, string>>;
  getTopicIdByName(topicName: string): Promise<number | null>;
  removeTopic(topicId: number): Promise<void>;
  clearTopics(): Promise<void>;
}

// Exemplo com Redis
class RedisTelegramMemory implements TelegramMemory {
  // implemente os métodos...
}

const logger = await TelegramLogger.getInstance({
  APIToken: process.env.TELEGRAM_BOT_TOKEN!,
  guildId: process.env.TELEGRAM_GROUP_ID!,
  memory: new RedisTelegramMemory(redisClient),
});
```

### Slack

O LogToHub também suporta Slack, usando a Web API oficial (`@slack/web-api`). Cada canal de log vira um canal do workspace.

#### Criando o app no Slack

O jeito mais rápido é criar o app a partir de um manifest, que já traz todos os scopes:

1. Acesse [api.slack.com/apps](https://api.slack.com/apps), clique em **Create New App** e escolha **From a manifest** (ou **Paste a manifest**).
2. Escolha o workspace e cole o manifest abaixo.
3. Clique em **Create** e depois em **Install to Workspace**.
4. Em **OAuth & Permissions**, copie o **Bot User OAuth Token** (`xoxb-...`).

```json
{
  "display_information": { "name": "LogToHub" },
  "features": { "bot_user": { "display_name": "LogToHub", "always_online": false } },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write", "chat:write.public",
        "channels:read", "channels:manage", "channels:join", "channels:write.invites",
        "groups:read", "groups:write", "groups:write.invites",
        "users:read", "users:read.email"
      ]
    }
  },
  "settings": { "org_deploy_enabled": false, "socket_mode_enabled": false, "token_rotation_enabled": false }
}
```

Se preferir, remova os scopes das funções que não vai usar:

| Scope | Para que serve | Necessário quando |
| --- | --- | --- |
| `chat:write`, `chat:write.public` | Enviar mensagens | Sempre |
| `channels:read`, `channels:manage`, `channels:join` | Listar, criar e entrar em canais públicos | Sempre |
| `groups:read`, `groups:write` | Listar e criar canais privados | `private: true` |
| `channels:write.invites` | Convidar pessoas para canais públicos | `members`, `everyone` ou `inviteOwner` |
| `groups:write.invites` | Convidar pessoas para canais privados | Idem, em canais privados |
| `users:read` | Encontrar o dono do workspace e listar os membros | `inviteOwner` ou `everyone` |
| `users:read.email` | Encontrar usuários pelo e-mail | `members` com e-mail |

Depois de adicionar um scope, reinstale o app no workspace.

#### Uso básico

```typescript
import { SlackLogger, ChannelType } from 'logtohub';

const logger = await SlackLogger.getInstance({
  APIToken: process.env.SLACK_BOT_TOKEN!,
  internalLogs: true,
  channelBots: [
    { name: "api", type: ChannelType.BotError },
    { name: "deploy", type: ChannelType.BotNotification },
  ],
});

await logger.awaitReady();

await logger.log({
  channel: { type: ChannelType.BotError },
  message: { error: "Falha ao conectar no banco" },
});
```

Os canais acima são criados como `#bot-error-api` e `#bot-notification-deploy`. Nas próximas inicializações, eles são reaproveitados.

#### Quem entra nos canais

No Slack, um canal criado por um bot começa só com o bot. Para que as pessoas vejam os canais na barra lateral, a lib convida membros automaticamente:

- Por padrão, o **Primary Owner** do workspace entra em todo canal (`inviteOwner: "primary"`).
- `members` aceita IDs de usuário (`U0123ABCD`) ou e-mails.
- `everyone: true` convida todos os membros ativos do workspace. Bots nunca são convidados, e guests só entram com `includeGuests: true`.
- Em canais que já existem, quem estiver faltando é convidado a cada inicialização (`syncMembers`). Assim, quem entrar no workspace depois também passa a ser incluído.

Toda opção pode ser definida globalmente e sobrescrita por canal em `slack`. Os `members` globais e os do canal são somados.

```typescript
const logger = await SlackLogger.getInstance({
  APIToken: process.env.SLACK_BOT_TOKEN!,
  // vale para todos os canais
  members: ["tech-lead@empresa.com"],
  inviteOwner: "admins",
  channelBots: [
    // público e com todo o workspace dentro
    {
      name: "deploy",
      type: ChannelType.BotNotification,
      slack: { everyone: true },
    },
    // privado, só com o time de backend (+ tech lead e admins)
    {
      name: "api",
      type: ChannelType.BotError,
      slack: { private: true, members: ["U0123ABCD", "dev@empresa.com"] },
    },
    // público, sem convidar ninguém
    {
      name: "auditoria",
      type: ChannelType.Common,
      slack: { inviteOwner: false, members: [], syncMembers: false },
    },
  ],
});
```

Se um convite falhar (e-mail inexistente, scope faltando, guest em canal restrito), o comportamento é definido por `onMemberError`: `"warn"` (aviso no console e segue), `"throw"` (lança um `BotError`) ou `"ignore"`.

Para notificar alguém em uma mensagem, use as menções do Slack no texto: `<!channel>`, `<!here>` ou `<@U0123ABCD>`.

**Limitações do Slack:**
- O bot não consegue entrar sozinho em canais privados que já existem. Convide-o com `/invite @seu-app`.
- Não existe um "entrar automaticamente para todos" via bot. Isso só é possível com os canais padrão do plano Enterprise (`admin.teams.settings.setDefaultChannels`, com token de admin).

#### Opções

| Opção | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `APIToken` | `string` | | Bot User OAuth Token (`xoxb-...`) |
| `channelBots` | `SlackChannelProps[]` | canais de notificação e erro | Canais a criar ou mapear |
| `internalLogs` | `boolean` | `false` | Exibe logs internos no console |
| `teamId` | `string` | | Valida se o token pertence a esse workspace |
| `privateChannels` | `boolean` | `false` | Padrão de `private` para os canais |
| `members` | `string[]` | `[]` | IDs ou e-mails convidados para todos os canais |
| `everyone` | `boolean` | `false` | Padrão de `everyone` para os canais |
| `includeGuests` | `boolean` | `false` | Inclui guests quando `everyone` está ativo |
| `inviteOwner` | `"primary" \| "owners" \| "admins" \| false` | `"primary"` | Quem do time de donos entra nos canais |
| `syncMembers` | `boolean` | `true` | Convida quem estiver faltando em canais que já existem |
| `onMemberError` | `"warn" \| "throw" \| "ignore"` | `"warn"` | O que fazer quando um convite falhar |

Opções por canal (`channelBots[].slack`): `private`, `members`, `everyone`, `includeGuests`, `inviteOwner` e `syncMembers`.

#### Testando com um workspace real

O repositório tem um script de teste manual que cria canais públicos e privados, convida membros e envia mensagens de exemplo. Use um workspace só para testes: o plano gratuito do Slack é suficiente.

```bash
SLACK_BOT_TOKEN=xoxb-... npm run test:slack

# opcional: testa o convite por e-mail ou ID no canal privado
SLACK_BOT_TOKEN=xoxb-... SLACK_TEST_MEMBERS="voce@email.com" npm run test:slack
```

Nunca coloque o token em arquivos versionados.

#### Destruindo a Instância

```typescript
await logger.destroy();
```

#### Armazenamento Customizado

Por padrão, o TelegramLogger usa um arquivo local para persistir os mapeamentos de tópicos. Você pode implementar seu próprio armazenamento:

```typescript
interface TelegramMemory {
  addTopic(topicName: string, topicId: number): Promise<void>;
  getAllTopics(): Promise<Record<number, string>>;
  getTopicIdByName(topicName: string): Promise<number | null>;
  removeTopic(topicId: number): Promise<void>;
  clearTopics(): Promise<void>;
}

// Exemplo com Redis
class RedisTelegramMemory implements TelegramMemory {
  // implemente os métodos...
}

const logger = await TelegramLogger.getInstance({
  APIToken: process.env.TELEGRAM_BOT_TOKEN!,
  guildId: process.env.TELEGRAM_GROUP_ID!,
  memory: new RedisTelegramMemory(redisClient),
});
```

### Slack

O LogToHub também suporta Slack, usando a Web API oficial (`@slack/web-api`). Cada canal de log vira um canal do workspace.

#### Criando o app no Slack

1. Acesse [api.slack.com/apps](https://api.slack.com/apps), clique em **Create New App** e escolha **From scratch**.
2. Em **OAuth & Permissions**, adicione os **Bot Token Scopes**:
   - `chat:write`: enviar mensagens
   - `chat:write.public`: enviar em canais públicos sem precisar entrar neles
   - `channels:read`: listar canais públicos
   - `channels:manage`: criar canais públicos
   - `channels:join`: entrar em canais públicos existentes
   - `groups:read` e `groups:write`: apenas se usar `privateChannels: true`
3. Clique em **Install to Workspace** e copie o **Bot User OAuth Token** (`xoxb-...`).

**Importante:** o bot não consegue entrar sozinho em canais privados que já existem. Convide-o com `/invite @seu-app`.

```typescript
import { SlackLogger, ChannelType } from 'logtohub';

const logger = await SlackLogger.getInstance({
  APIToken: process.env.SLACK_BOT_TOKEN!,
  internalLogs: true,
  channelBots: [
    { name: "api", type: ChannelType.BotError },
    { name: "deploy", type: ChannelType.BotNotification },
  ],
});

await logger.awaitReady();

await logger.log({
  channel: { type: ChannelType.BotError },
  message: { error: "Falha ao conectar no banco" },
});
```

Os canais acima são criados como `#bot-error-api` e `#bot-notification-deploy`. Nas próximas inicializações, eles são reaproveitados.

#### Opções

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `APIToken` | `string` | Bot User OAuth Token (`xoxb-...`) |
| `channelBots` | `CreateTextChannelProps[]` | Canais a criar ou mapear (padrão: canais de notificação e erro) |
| `internalLogs` | `boolean` | Exibe logs internos no console |
| `teamId` | `string` | Opcional. Valida se o token pertence a esse workspace |
| `privateChannels` | `boolean` | Cria e mapeia canais privados (padrão: `false`) |

#### Destruindo a Instância

```typescript
await logger.destroy();
```

## 🗺️ Roadmap

- [X] Suporte a Telegram
- [X] Suporte a Slack
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
MIT © [Walefy](https://github.com/walefy)

## 🔗 Links Úteis

- [Documentação Discord.js](https://discord.js.org/)
- [Como criar um bot Discord](https://discord.com/developers/docs/intro)
- [Obter token do bot Discord](https://discord.com/developers/applications)
- [Documentação Grammy (Telegram)](https://grammy.dev/)
- [Slack Web API (Node SDK)](https://tools.slack.dev/node-slack-sdk/web-api)
- [Criar um app no Slack](https://api.slack.com/apps)
- [Como criar um bot Telegram](https://core.telegram.org/bots/tutorial)

---

**Nota**: Este pacote está em desenvolvimento ativo. A API pode sofrer alterações até a versão 1.0.0.
