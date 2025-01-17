import "reflect-metadata";
import { DataSource } from "typeorm";
import { Bot } from "./entities/Bot.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USER || "nest_user",
  password: process.env.DB_PASSWORD || "nest_password",
  database: process.env.DB_NAME || "nest_db",
  entities: [
    Bot,
    // BotHistory,
    // Metrics,
  ],
  synchronize: true,
});

export async function connectToDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Connected to the database successfully!");
  } catch (error) {
    console.error("Error connecting to the database", error);
    process.exit(1);
  }
}
