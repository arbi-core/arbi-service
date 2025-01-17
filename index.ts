import { buildApp } from "./app";

async function main() {
  const app = await buildApp();
  await app.listen({ port: 8080 });
  console.log("Server is running on http://localhost:8080");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
