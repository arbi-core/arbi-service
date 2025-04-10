import { Bot } from "../../database/entities/Bot.entity";

/**
 * Common interface for all bot strategies
 */
export interface BotStrategy {
  /**
   * Execute the strategy for a given bot
   * @param bot The bot to execute the strategy for
   * @returns Result of the execution
   */
  execute(bot: Bot): Promise<any>;

  /**
   * Clean up resources used by this strategy
   */
  cleanup?(): void;
}