// Teste manual do SlackLogger contra um workspace real.
// Uso: SLACK_BOT_TOKEN=xoxb-... npm run test:slack
// Opcional: SLACK_TEST_MEMBERS="voce@email.com,U0123ABCD" para testar convites por e-mail/ID
import { SlackLogger, ChannelType } from "../src/index.js";

async function main() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("Defina SLACK_BOT_TOKEN antes de rodar o teste.");
  }

  const extraMembers = (process.env.SLACK_TEST_MEMBERS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const logger = await SlackLogger.getInstance({
    APIToken: token,
    internalLogs: true,
    inviteOwner: "primary", // padrão: o dono do workspace entra em todo canal
    channelBots: [
      // público; já existe dos testes anteriores, então o dono é sincronizado
      { name: "api", type: ChannelType.BotError, description: "Erros da API" },
      // público e com todo o workspace dentro
      {
        name: "deploy",
        type: ChannelType.BotNotification,
        description: "Deploys (todos os membros)",
        slack: { everyone: true },
      },
      // privado, só com o dono + quem estiver em SLACK_TEST_MEMBERS
      {
        name: "seguranca",
        type: ChannelType.Common,
        description: "Alertas de segurança (privado)",
        slack: { private: true, members: extraMembers },
      },
    ],
  });
  await logger.awaitReady();

  console.log("Canais mapeados:", [...logger.allChannels.keys()]);

  // 1. Sem canal: vai para o canal de notificação
  await logger.log({ message: "✅ teste simples do logtohub" });

  // 2. Objeto em bloco de código (sem a palavra "json")
  await logger.log({
    channel: { type: ChannelType.BotError },
    message: { erro: "falha ao conectar no banco", code: 500 },
  });

  // 3. Canal inexistente: cai no canal de notificação com o aviso
  await logger.log({
    channel: "nao-existe",
    message: "deve cair no canal de notificação",
  });

  // 4. Mensagem longa: truncada em 4000 caracteres com o bloco fechado
  await logger.log({
    channel: { type: ChannelType.BotError },
    message: { grande: "x".repeat(6000) },
  });

  // 5. Canal privado + menção para notificar quem está nele
  await logger.log({
    channel: "seguranca",
    message: "<!channel> 🔒 alerta de teste no canal privado",
  });

  console.log("Mensagens enviadas. Confira os canais no Slack.");
}

main().catch((err) => {
  console.error("Falhou:", err instanceof Error ? err.message : err);
  process.exit(1);
});
