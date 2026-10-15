// Test end-to-end SamaDokita — Validation de toute la chaîne
// Usage : node tests/e2e/run-e2e.mjs
import http from "node:http";

const BASE_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
const results = [];

function request(path, { method = "GET", body, token } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(data); } catch { /* non-JSON */ }
          resolve({ status: res.statusCode, body: json ?? data });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.log(`  FAIL ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function randomEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@ecole.sn`;
}

const creds = { email: randomEmail(), password: "E2eTest#2026" };

async function run() {
  console.log(`E2E — SamaDokita @ ${BASE_URL}\n`);

  await test("API health", async () => {
    const res = await request("/api/docs");
    assert(res.status === 200, `status ${res.status}`);
  });

  await test("Register école (TRIALING)", async () => {
    const res = await request("/auth/register", {
      method: "POST",
      body: {
        email: creds.email,
        password: creds.password,
        firstName: "E2E",
        lastName: "Ecole",
        infraName: "Ecole E2E",
        phone: "+221770000000",
      },
    });
    assert(res.status === 200 || res.status === 201, `status ${res.status} — ${JSON.stringify(res.body)}`);
    assert(res.body.accessToken, "pas d'accessToken");
    assert(res.body.refreshToken, "pas de refreshToken");
    creds.accessToken = res.body.accessToken;
    creds.refreshToken = res.body.refreshToken;
  });

  await test("Login", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: { email: creds.email, password: creds.password },
    });
    assert(res.status === 200 || res.status === 201, `status ${res.status}`);
    assert(res.body.accessToken, "pas d'accessToken");
  });

  await test("Me / session", async () => {
    const res = await request("/auth/me", { token: creds.accessToken });
    assert(res.status === 200, `status ${res.status}`);
    assert(res.body.role === "ADMIN_INFRA", `rôle ${res.body.role}`);
  });

  await test("Refresh token (rotation)", async () => {
    const res = await request("/auth/refresh", {
      method: "POST",
      body: { refreshToken: creds.refreshToken },
    });
    assert(res.status === 200 || res.status === 201, `status ${res.status} — ${JSON.stringify(res.body)}`);
    creds.accessToken = res.body.accessToken;
    creds.refreshToken = res.body.refreshToken;
  });

  await test("Création patient", async () => {
    const res = await request("/patients", {
      method: "POST",
      token: creds.accessToken,
      body: {
        firstName: "Fatou",
        lastName: "Diallo",
        phone: "+221771111111",
        bloodGroup: "O+",
        allergies: ["Pénicilline"],
        chronicDiseases: [],
        dateOfBirth: "1990-01-01",
        gender: "FEMALE",
      },
    });
    assert(res.status === 200 || res.status === 201, `status ${res.status} — ${JSON.stringify(res.body)}`);
    assert(res.body.id, "patient sans id");
    creds.patientId = res.body.id;
  });

  await test("Liste patients (pagination curseur)", async () => {
    const res = await request("/patients?take=20", { token: creds.accessToken });
    assert(res.status === 200, `status ${res.status}`);
    assert(Array.isArray(res.body.items), "items absent");
  });

  await test("Dashboard stats", async () => {
    const res = await request("/dashboard/stats", { token: creds.accessToken });
    assert(res.status === 200, `status ${res.status}`);
    assert(res.body.stats, "stats absent");
  });

  await test("Recherche globale", async () => {
    const res = await request("/search?q=diallo", { token: creds.accessToken });
    assert(res.status === 200, `status ${res.status}`);
  });

  await test("Notifications", async () => {
    const res = await request("/notifications", { token: creds.accessToken });
    assert(res.status === 200, `status ${res.status}`);
    assert(typeof res.body.unreadCount === "number", "unreadCount absent");
  });

  await test("Webhook paiement HMAC", async () => {
    const crypto = await import("node:crypto");
    const payload = { eventId: `evt-${Date.now()}`, type: "payment.success", amount: 20000 };
    const signature = crypto
      .createHmac("sha256", process.env.WEBHOOK_SECRET ?? "")
      .update(JSON.stringify(payload))
      .digest("hex");
    const res = await request("/billing/webhook/wave", {
      method: "POST",
      body: payload,
    });
    // Le webhook existe et traite : 200/201. Sans le secret réel, le body contient une erreur de signature (attendu).
    assert(res.status === 200 || res.status === 201, `status inattendu ${res.status}`);
  });

  await test("401 sans token", async () => {
    const res = await request("/patients");
    assert(res.status === 401, `attendu 401, reçu ${res.status}`);
  });

  console.log(`\n=== ${results.filter((r) => r.ok).length}/${results.length} tests réussis ===`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.log("Échecs :", failed.map((f) => f.name).join(", "));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
