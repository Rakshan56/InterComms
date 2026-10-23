import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
const port = env.apiPort;
app.listen(port, () => console.log(`InterComms API listening on ${port}`));
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });
