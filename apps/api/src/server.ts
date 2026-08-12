import { buildApp } from "./app";

const { app, config } = await buildApp();

const close = async () => {
  await app.close();
  process.exit(0);
};

process.once("SIGINT", close);
process.once("SIGTERM", close);

try {
  await app.listen({ host: config.HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exit(1);
}
