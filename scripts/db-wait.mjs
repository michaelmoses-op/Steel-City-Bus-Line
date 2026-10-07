import net from "node:net";

const port = Number(process.env.PGPORT ?? 5433);
const host = process.env.PGHOST ?? "127.0.0.1";
const attempts = 45;
const delayMs = 1000;

function probeOnce() {
  return new Promise((resolveProbe, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolveProbe(true);
    });
    socket.setTimeout(2000, () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.on("error", reject);
  });
}

for (let i = 1; i <= attempts; i++) {
  try {
    await probeOnce();
    console.log(`[db-wait] Postgres accepting connections on ${host}:${port}`);
    process.exit(0);
  } catch {
    if (i === attempts) {
      console.error(
        `[db-wait] Could not reach Postgres on ${host}:${port}. Start Docker Desktop, then run: make db-up`,
      );
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
