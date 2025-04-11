// Load environment variables from .env file
import 'dotenv/config';

import { buildApp } from "./app";
import { BotManagerService } from "./modules/api/bot-manager/bot-manager.service";

async function main() {
  const app = await buildApp();
  await app.listen({ port: 8080 });
  console.log("Server is running on http://localhost:8080");

  // Initialize the BotManagerService to restart any active bots
  const botManagerService = BotManagerService.getInstance();
  await botManagerService.initialize();

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
