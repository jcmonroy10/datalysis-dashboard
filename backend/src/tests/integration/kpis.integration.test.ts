import request from "supertest";
import express from "express";
import { kpisHandler } from "../../adapters/http/kpis.controller";
import { asyncHandler } from "../../adapters/http/middlewares/asyncHandler";
import { errorHandler } from "../../adapters/http/middlewares/errorHandler";

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    $queryRawUnsafe: jest.fn().mockResolvedValue([
      {
        gmv: 1000,
        revenue: 900,
        orders: 10,
        aov: 90,
        ipo: 1.5,
        cancel_rate: 0.02,
        on_time_rate: 0.95,
      },
    ]),
  },
}));

const app = express();
app.use(express.json());
app.get("/api/kpis", asyncHandler(kpisHandler));
app.use(errorHandler);

describe("GET /api/kpis", () => {
  it("returns 200 with KPI data for valid date range", async () => {
    const res = await request(app).get("/api/kpis").query({ from: "2017-01-01", to: "2018-01-01" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("gmv");
    expect(res.body[0]).toHaveProperty("revenue");
    expect(res.body[0]).toHaveProperty("orders");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    const { prisma } = require("../../infrastructure/db/prisma");
    prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/api/kpis").query({ from: "2017-01-01", to: "2018-01-01" });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
