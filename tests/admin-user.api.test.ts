import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import app from "../src/app";
import { UserModel } from "../src/models/user.model";

let mongo: MongoMemoryServer;

const admin = {
  fullName: "Campus Admin",
  email: "admin@example.test",
  password: "AdminPass123",
};

async function loginAsAdmin() {
  await request(app).post("/api/v1/auth/register").send(admin).expect(201);
  await UserModel.updateOne({ email: admin.email }, { role: "admin" });
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: admin.email, password: admin.password })
    .expect(200);
  return response.body.data.token as string;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("admin user management API", () => {
  it("rejects anonymous and non-admin access", async () => {
    await request(app).get("/api/v1/admin/users").expect(401);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Regular User",
      email: "user@example.test",
      password: "RegularPass123",
    });
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.test", password: "RegularPass123" });

    await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .expect(403);
  });

  it("creates, views, searches, paginates, updates, and deletes users", async () => {
    const token = await loginAsAdmin();
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app)
      .post("/api/v1/admin/users")
      .set(auth)
      .send({
        fullName: "Maya Shrestha",
        email: "maya@example.test",
        password: "SecurePass123",
        role: "user",
        status: "active",
      })
      .expect(201);

    expect(created.body.password).toBeUndefined();

    const viewed = await request(app)
      .get(`/api/v1/admin/users/${created.body.id}`)
      .set(auth)
      .expect(200);
    expect(viewed.body.email).toBe("maya@example.test");

    const listed = await request(app)
      .get("/api/v1/admin/users?page=1&limit=1&search=maya")
      .set(auth)
      .expect(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.meta).toEqual({
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1,
    });

    const updated = await request(app)
      .patch(`/api/v1/admin/users/${created.body.id}`)
      .set(auth)
      .send({ role: "admin", status: "inactive" })
      .expect(200);
    expect(updated.body).toMatchObject({ role: "admin", status: "inactive" });

    await request(app)
      .delete(`/api/v1/admin/users/${created.body.id}`)
      .set(auth)
      .expect(204);
    await request(app)
      .get(`/api/v1/admin/users/${created.body.id}`)
      .set(auth)
      .expect(404);
  });
});
