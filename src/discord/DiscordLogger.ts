import {
  ChannelType as DiscordChannelType,
  Client as DiscordClient,
  PermissionsBitField,
  TextChannel,
} from "discord.js";

import * as Types from "../types/index.js";
import * as utils from "./utils.js";

import { discordChannelAdapter } from "./factory.js";
import { Logger } from "../AbstractLogger.js";
import { defaultBotChannels } from "./channels/index.js";
import { CreateTextChannelProps } from "../types/index.js";
import { defaultBot } from "./index.js";

export class DiscordLogger extends Logger {
  private clientInstance: DiscordClient;

  static async getInstance({
    options,
    APIToken,
    channelBots,
    internalLogs,
    env,
  }: Types.PlatformDiscordConstructor): Promise<DiscordLogger> {
    const discordEv = new DiscordClient(options ?? defaultBot);

    await discordEv.login(APIToken);

    return new Promise<DiscordLogger>((resolve) =>
      discordEv.once("clientReady", async (client) => {
        // this bot just manager one discord server.
        const guildCollection = await client.guilds.fetch();
        const [, guild] = Array.from(guildCollection)[0];

        const { channels } = await client.guilds.fetch(guild.id);

        const allChannels = Array.from((await channels.fetch()).values());

        const textChannels = allChannels
          .filter((ch): ch is TextChannel => ch instanceof TextChannel)
          .map((discordChannel) => {
            const { topic, env } = utils.decodeChannelByName(
              discordChannel.name
            );
            const type = utils.channelTypeResolve(topic);

            return discordChannelAdapter({
              discordChannel,
              type,
              env,
            });
          });

        const instance = new DiscordLogger(
          textChannels,
          {
            channels: channelBots ?? defaultBotChannels,
            groupId: guild.id,
            env,
          },
          client,
          internalLogs
        );

        await instance.startChat();

        console.log(`
────────────────────────────────────────────
🤖  Bot conectado com sucesso!
🪪  Usuário: ${client.user?.tag}
🌐  Guilda: ${guild.id} — ${guild.name}
────────────────────────────────────────────
`);

        resolve(instance);
      })
    );
  }

  private constructor(
    existingChannels: Types.TextChannel[],
    channelsToCreate: Types.CreationChannels,
    client: DiscordClient,
    internalLogs: boolean = false
  ) {
    super(Types.Platforms.DISCORD, existingChannels, internalLogs);
    this.clientInstance = client;
    this.processChannels(channelsToCreate);
  }

  public async deleteAllChannels() {
    const channelsToDelete = this.getChannelArray();

    await Promise.allSettled(
      channelsToDelete.map(async (ch) => ch.removeChannel())
    );
  }

  public async createChannel(
    options: CreateTextChannelProps,
    guildId: string
  ): Promise<Types.TextChannel> {
    const guild = await this.clientInstance.guilds.fetch(guildId);
    await guild.roles.fetch();

    const name = utils.generateChannelName(options);

    const botId = this.clientInstance.user?.id ?? "";
    const everyoneId = guild.roles.everyone;

    const permissionOverwrites = options.botOnly
      ? [
          {
            id: everyoneId,
            deny: [PermissionsBitField.Flags.SendMessages],
          },
          {
            id: botId,
            allow: [PermissionsBitField.Flags.SendMessages],
          },
        ]
      : [];

    const type = utils.channelTypeResolve(name);
    const discordChannel = await guild.channels.create({
      type: DiscordChannelType.GuildText,
      name,
      reason: options.description,
      permissionOverwrites,
    });

    return discordChannelAdapter({
      discordChannel,
      type,
      env: options.env,
    });
  }

  public async startChat() {
    this.internalLog("Serviço de resposta de chat iniciado ✅");
    this.clientInstance.on("messageCreate", async (message) => {
      console.log("Mensagem recebida:", message.content);
      if (message.author.bot) return; // evita loop do próprio bot

      if (message.content === "!deleteAllChannels") {
        await message.reply("🧹 Executando exclusão de todos os canais...");
        await this.deleteAllChannels();
        await message.reply("✅ Todos os canais foram excluídos com sucesso!");
      }
    });
  }
}
