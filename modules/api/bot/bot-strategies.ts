import { Bot, Exchange } from "../../database/entities/Bot.entity";


export interface BotStrategy {
  execute(bot: Bot): Promise<any>;
}

export class MonitoringBotStrategy implements BotStrategy {
  async execute(bot: Bot): Promise<any> {
    console.log(`Monitoring bot ${bot}`);
    return { status: "success", message: "Monitoring completed" };
  }
}

export class TradingBotStrategy implements BotStrategy {
  async execute(bot: Bot): Promise<any> {
    console.log(`[TradingBotStrategy] Trading bot. Bot name: ${bot.name}`);
    return { status: "success", message: "Trading action completed" };
  }
}

export class BotStrategyFactory {
  static getStrategy(bot: Bot): BotStrategy {
    if (bot.exchange1 === Exchange.UNISWAP2) {
      return new TradingBotStrategy();
    } else if (bot.exchange1 === Exchange.SUSHISWAP) {
      return new TradingBotStrategy();
    } else if (bot.exchange1 === Exchange.PANCAKE) {
      return new TradingBotStrategy();
    } else {
      return new MonitoringBotStrategy();
    }
  }
}