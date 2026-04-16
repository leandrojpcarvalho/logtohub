import { TelegramMemory as TelegramMemory } from "./types";
import fs from "node:fs/promises";
import path from "node:path";

interface TelegramMemoryFile {
  topics: {
    [key: number]: string
  };
}

export class TelegramLocalMemory implements TelegramMemory {
  private _memoryFilePath = "./.logtohub/telegram-memory.json";
  private _cache: TelegramMemoryFile = { topics: {} };
  private _writePending = false;

  constructor(path?: string) {
    if (path) this._memoryFilePath = path;
    this.init();
  }

  private async init() {
    await this.createMemoryFile();
    this._cache = await this.readMemoryFile();
  }

  async addTopic(topicName: string, topicId: number): Promise<void> {
    this._cache.topics[topicId] = topicName;
    await this.flushToDisk();
  }
  
  async getAllTopics(): Promise<Record<number, string>> {
    return { ...this._cache.topics };
  }

  async getTopicIdByName(topicName: string): Promise<number | null> {
    for (const [id, name] of Object.entries(this._cache.topics)) {
      if (name === topicName) {
        return Number(id);
      }
    }
    return null;
  }

  async clearTopics(): Promise<void> {
    this._cache = { topics: {} };
    await this.saveMemoryFile();
  }

  async removeTopic(topicId: number): Promise<void> {
    delete this._cache.topics[topicId];
    await this.flushToDisk();
  }

  private async flushToDisk(): Promise<void> {
    if (this._writePending) return;
    this._writePending = true;
    await this.saveMemoryFile();
    this._writePending = false;
  }

  private async createMemoryFile(): Promise<void> {
    const folder = path.dirname(this._memoryFilePath);
    await fs.mkdir(folder, { recursive: true });

    try {
      await fs.access(this._memoryFilePath);
    } catch {
      await fs.writeFile(this._memoryFilePath, JSON.stringify({ topics: {} }));
    }
  }

  private async readMemoryFile(): Promise<TelegramMemoryFile> {
    try {
      const data = await fs.readFile(this._memoryFilePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return { topics: {} };
    }
  }

  private async saveMemoryFile(): Promise<void> {
    await fs.writeFile(this._memoryFilePath, JSON.stringify(this._cache, null, 2));
  }
}
