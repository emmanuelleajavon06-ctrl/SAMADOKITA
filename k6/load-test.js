import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "2m", target: 1200 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.API_URL ?? "http://localhost:3001";
const TEST_EMAIL = __ENV.TEST_EMAIL ?? "";
const TEST_PASSWORD = __ENV.TEST_PASSWORD ?? "";

export default function () {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }), { headers: { "Content-Type": "application/json" } });

  check(loginRes, {
    "login 200": (r) => r.status === 200,
    "login < 300ms": (r) => r.timings.duration < 300,
  });

  if (loginRes.status !== 200 || !loginRes.json("accessToken")) {
    sleep(1);
    return;
  }

  const headers = { Authorization: `Bearer ${loginRes.json("accessToken")}` };

  const patientsRes = http.get(`${BASE_URL}/patients?take=20`, { headers });
  check(patientsRes, {
    "patients 200": (r) => r.status === 200,
    "patients < 200ms": (r) => r.timings.duration < 200,
  });

  const statsRes = http.get(`${BASE_URL}/dashboard/stats`, { headers });
  check(statsRes, { "stats 200": (r) => r.status === 200 });

  const searchRes = http.get(`${BASE_URL}/search?q=a`, { headers });
  check(searchRes, { "search 200": (r) => r.status === 200 });

  const notifRes = http.get(`${BASE_URL}/notifications?take=20`, { headers });
  check(notifRes, { "notifications 200": (r) => r.status === 200 });

  sleep(1);
}
