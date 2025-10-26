import {
  BotErrorMessage,
  BotErrorModules,
  TextChannel,
  ChannelType,
  CreateTextChannelProps,
  CreationChannels,
  FindChannelsOptions,
  LogLike,
  Platform,
  Platforms,
  SendMessage,
  Status,
  BotError,
  convertDataToString,
  Environment,
} from "./index.js";

export abstract class Logger implements Platform {
  private _allChannels = new Map<string, TextChannel>();
  private _internalLogs: boolean | undefined;

  platform: Platforms;

  private _status: Status = Status.CREATING;

  abstract createChannel(
    textChannelProps: CreateTextChannelProps,
    groupId?: string | number
  ): Promise<TextChannel>;

  constructor(
    platform: Platforms,
    existingChannels: TextChannel[],
    internalLogs?: boolean
  ) {
    if (existingChannels.length > 0) {
      existingChannels.forEach((ch) => {
        this.addChannel(ch);
      });
    }
    this.platform = platform;
    this._internalLogs = internalLogs;
  }

  protected setStatus(status: Status) {
    this._status = status;
  }

  private addChannel(channel: TextChannel) {
    this._allChannels.set(channel.name, channel);
    this.internalLog(
      `Canal ${channel.name} adicionado com sucesso aos mapeados`
    );
  }

  private validChannelToCreate(channel: CreateTextChannelProps) {
    const isMappedChannel = this.getByCompleteName(channel);
    if (isMappedChannel) {
      throw new BotError(
        BotErrorMessage.DUPLICATED_CHANNEL,
        BotErrorModules.Instance
      );
    }
  }

  protected async processChannel(
    channel: CreateTextChannelProps,
    groupId?: string | number
  ) {
    this.validChannelToCreate(channel);

    const newChannel = await this.createChannel(channel, groupId);

    return newChannel;
  }

  private createEnvChannel<T extends string[]>(
    channels: CreateTextChannelProps[],
    env?: Environment<T> | T
  ): CreateTextChannelProps[] {
    if (!env) return channels;

    const envList = Array.isArray(env) ? env : env.env;

    const channelsList: CreateTextChannelProps[] = [];
    for (const channel of channels) {
      for (const key of envList) {
        const newChannel = this.processEnvironmentProps(channel, key, env);
        if (newChannel) {
          channelsList.push(newChannel);
        }
      }
    }

    return channelsList;
  }

  private processEnvironmentProps<T extends string[]>(
    channel: CreateTextChannelProps,
    key: T[number] | string,
    environment: Environment<T> | T
  ) {
    const newChannel = { ...channel };

    if (Array.isArray(environment)) {
      newChannel.env = key;
      return newChannel;
    }
    const ignoredList = environment.ignoredChannelsByEnv[key] ?? [];
    if (!ignoredList.includes(newChannel.name)) {
      newChannel.env = key;
      return newChannel;
    }
  }

  public async processChannels<T extends string[]>({
    channels,
    groupId,
    env,
  }: CreationChannels<T>) {
    const errors = [];

    const channelsToCreate = this.createEnvChannel(channels, env);

    for (const channel of channelsToCreate) {
      try {
        const newChannel = await this.processChannel(channel, groupId);
        this.addChannel(newChannel);
      } catch (err) {
        if (err instanceof Error) {
          errors.push(err.message);
        } else {
          errors.push(`Unknown cause: ${convertDataToString(err)}`);
        }
      }
    }

    let resume = "Canais criados com sucesso";

    if (errors.length !== 0) {
      const channel = Array.from(this._allChannels.values())[0];
      if (!channel) {
        throw new BotError(
          convertDataToString(errors),
          BotErrorModules.Instance
        );
      }
      resume = `Alguns canais apresentaram os seguintes errors:\n ${convertDataToString(
        errors
      )}`;
    }

    this.setStatus(Status.READY);
    this.internalLog(resume);
  }

  private chooseChannelByPriority(msg: LogLike) {
    const notification = this.getChannel(ChannelType.BotNotification);
    if (notification) {
      return notification.sendMessage(msg);
    }
    const error = this.getChannel(ChannelType.BotError);
    if (error) {
      return error.sendMessage(msg);
    }
    const common = this.getChannel(ChannelType.Common);
    if (common) {
      return common.sendMessage(msg);
    }

    throw new BotError(
      "Não foi possivel enviar a mensagem",
      BotErrorModules.Instance
    );
  }

  protected getChannelArray() {
    return Array.from(this._allChannels.values());
  }

  private findSomethingOnChannel(key: keyof TextChannel, toFind: string) {
    return this.getChannelArray().find((ch) => {
      const normalizedStr = String(ch[key]).toLowerCase().replaceAll(" ", "-");
      const normalizedFind = toFind.toLowerCase().replaceAll(" ", "-");

      return normalizedStr.includes(normalizedFind);
    });
  }

  private getByCompleteName(data: CreateTextChannelProps) {
    return (
      this.getChannelArray().find((ch) => {
        return (
          ch.name.includes(data.name.toLowerCase().replaceAll(" ", "-")) &&
          ch.type === data.type &&
          ch.env === data.env
        );
      }) ?? null
    );
  }

  private getChannelByType(type: string): TextChannel | null {
    return this.findSomethingOnChannel("type", type) ?? null;
  }

  private getChannelByName(name: string) {
    return this.findSomethingOnChannel("name", name) ?? null;
  }

  public getChannel(
    nameOrType: string | CreateTextChannelProps
  ): TextChannel | null {
    if (typeof nameOrType === "object" && "name" in nameOrType) {
      return this.getByCompleteName(nameOrType);
    }
    return (
      this.getChannelByName(nameOrType) || this.getChannelByType(nameOrType)
    );
  }

  private selectChannelByType(type: FindChannelsOptions) {
    const mapper: Record<
      FindChannelsOptions,
      (str: string) => TextChannel | null
    > = {
      any: this.getChannel.bind(this),
      name: this.getChannelByName.bind(this),
      type: this.getChannelByType.bind(this),
    };
    return mapper[type];
  }

  private trySendMessage(
    str: string,
    type: FindChannelsOptions,
    messageToSend: LogLike
  ): Promise<void> {
    const channel = this.selectChannelByType(type)(str);
    if (channel) {
      return channel.sendMessage(messageToSend);
    }
    return this.chooseChannelByPriority({
      errorMessage: "Mensagem não foi enviada",
      type: BotErrorMessage.NOT_FOUND_CHANNEL,
      tryProcess: messageToSend,
    });
  }

  public log({ channel, message }: SendMessage): Promise<void> {
    if (channel) {
      if (typeof channel === "string") {
        return this.trySendMessage(channel, "any", message);
      }
      if ("name" in channel) {
        return this.trySendMessage(channel.name, "name", message);
      }
      return this.trySendMessage(channel.type, "type", message);
    }
    return this.chooseChannelByPriority(message);
  }

  get status() {
    return this._status;
  }

  get allChannels() {
    return this._allChannels;
  }

  public internalLog(msg: LogLike) {
    if (this._internalLogs) {
      console.log(convertDataToString(msg));
    }
  }
}
