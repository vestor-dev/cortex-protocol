const request = require("supertest");
const app = require("../app");

describe("GET /api/v1/agents", () => {
  it("returns a list of agents", async () => {
    const res = await request(app).get("/api/v1/agents").expect(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("filters by capability", async () => {
    const res = await request(app)
      .get("/api/v1/agents?capability=Reasoning")
      .expect(200);
    res.body.data.forEach((a) => {
      expect(a.capabilities).toContain("Reasoning");
    });
  });

  it("rejects invalid capability", async () => {
    await request(app).get("/api/v1/agents?capability=FlyLikeBird").expect(422);
  });
});

describe("GET /api/v1/agents/:id", () => {
  it("returns an agent by id", async () => {
    const res = await request(app).get("/api/v1/agents/1").expect(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 for unknown agent", async () => {
    await request(app).get("/api/v1/agents/99999").expect(404);
  });
});

describe("GET /health", () => {
  it("responds ok", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
  });
});
