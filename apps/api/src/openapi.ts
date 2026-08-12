import { buildApp } from "./app";

const { app } = await buildApp({ logger: false });
await app.ready();
process.stdout.write(`${JSON.stringify(app.swagger(), null, 2)}\n`);
await app.close();
