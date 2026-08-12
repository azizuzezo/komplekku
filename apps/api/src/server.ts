import { buildApp } from "./app";

try {
  const { app, config } = await buildApp();

  const close = async () => {
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", close);
  process.once("SIGTERM", close);

  await app.listen({ host: config.HOST, port: config.API_PORT });
  console.log(`Server running on http://${config.HOST}:${config.API_PORT}`);
  console.log(`Database host: ${new URL(config.DATABASE_URL).host}`);
  console.log(`Env keys seen (${Object.keys(process.env).length}): ${Object.keys(process.env).sort().join(", ")}`);
} catch (error) {
  console.error("FATAL SERVER ERROR:", error);
  process.exit(1);
}

