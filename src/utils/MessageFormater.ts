import { LogLike } from '../types';

/**
 * MessageFormatter is responsible for formatting log messages into a string representation.
 * It handles strings, arrays, and objects, converting them into a readable format.
 * 
 * Usage:
 * ```typescript
 * const formattedMessage = MessageFormatter.format(message);
 * console.log(formattedMessage);
 * 
 * // Output for object message:
 * // **key1**: value1
 * // **key2**: value2
 * // **Timestamp**: 2024-06-01T12:00:00.000Z
 * ```
*/
export class MessageFormatter {
  public static format(message: LogLike): string {
    if (typeof message === 'string') {
      return message;
    } else if (Array.isArray(message)) {
      return message.map((msg) => this.format(msg)).join(' ');
    } else if (typeof message === 'object') {
      return this.convertObjectToString(message as Record<string, unknown>);
    }

    return String(message);
  }

  private static convertObjectToString(obj: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();

    let msgStr = Object.entries(obj)
      .map(([key, value]) => `**${key}**: ${value}`)
      .join('\n');

    msgStr += `\n**Timestamp**: ${timestamp}\n`;

    return msgStr;
  }
}
