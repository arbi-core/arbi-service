import "reflect-metadata";
import { DataSource } from "typeorm";
import { Bot } from "./entities/Bot.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "bots_db",
  synchronize: true,
  logging: false,
  entities: [Bot],
  migrations: ["./migrations/*.ts"],
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
