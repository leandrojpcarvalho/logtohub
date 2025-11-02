import { TelegramMemory as TelegramMemory } from "./types";
import fs from "node:fs";
import path from "node:path";

interface TelegramMemoryFile {
  topics: {
    [key: number]: string
  };
}

export class TelegramLocalMemory implements TelegramMemory {
  private _memoryFilePath = "./.logtohub/telegram-memory.json";

  constructor(path?: string) {
    if (path) this._memoryFilePath = path;

    this.createMemoryFile();
  }

  async addTopic(topicName: string, topicId: number): Promise<void> {
    const memoryFile = this.readMemoryFile();
    memoryFile.topics[topicId] = topicName;
    this.saveMemoryFile(memoryFile);
  }
  
  async getAllTopics(): Promise<Record<number, string>> {
    const memoryFile = this.readMemoryFile();
    return memoryFile.topics;
  }

  async getTopicIdByName(topicName: string): Promise<number | null> {
    const memoryFile = this.readMemoryFile();
    console.log(memoryFile);
    for (const [id, name] of Object.entries(memoryFile.topics)) {
      if (name === topicName) {
        return Number(id);
      }
    }

    return null;
  }

  async clearTopics(): Promise<void> {
    const memoryFile: TelegramMemoryFile = { topics: {} };
    this.saveMemoryFile(memoryFile);
  }

  async removeTopic(topicId: number): Promise<void> {
    const memoryFile = this.readMemoryFile();
    delete memoryFile.topics[topicId];
    this.saveMemoryFile(memoryFile);
  }

  private async createMemoryFile() {
    try {
      const folder = path.dirname(this._memoryFilePath);
  
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
  
      if (fs.existsSync(this._memoryFilePath)) return this._memoryFilePath;
  
      fs.writeFileSync(this._memoryFilePath, JSON.stringify({ topics: {} }));
      return this._memoryFilePath;
    } catch {
      throw new Error("Erro ao criar o arquivo de memória do Telegram.");
    }
  }

  private readMemoryFile(): TelegramMemoryFile {
    try {
      const data = fs.readFileSync(this._memoryFilePath, "utf-8");
      return JSON.parse(data);
    } catch {
      throw new Error("Erro ao ler o arquivo de memória do Telegram.");
    }
  }

  private saveMemoryFile(info: TelegramMemoryFile) {
    try {
      fs.writeFileSync(this._memoryFilePath, JSON.stringify(info, null, 2));
    } catch {
      throw new Error("Erro ao salvar o arquivo de memória do Telegram.");
    }
  }
}
