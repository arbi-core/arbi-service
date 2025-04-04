// Re-export the Bot entity type from the database for consistency
import { Bot as BotEntity } from "../../database/entities/Bot.entity";

// Export useful type aliases for the API layer
export type Bot = BotEntity;

// Bot status type for improved type safety
export type BotStatus = "active" | "stopped" | "paused";
