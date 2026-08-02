import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import app from "../src/app";
import { lastTestResetLink, lastTestResetOtp } from "../src/services/email.service";
import { PasswordResetTokenModel } from "../src/models/password-reset-token.model";
import { ListingModel } from "../src/models/listing.model";
import fs from "fs/promises";
import path from "path";

let mongo: MongoMemoryServer;

const firstUser = {
  fullName: "Maya Student",
  email: "maya.student@example.test",
  password: "SecurePass123",
};

const secondUser = {
  fullName: "Aarav Student",
  email: "aarav.student@example.test",
  password: "SecurePass456",
};

const validListing = {
  title: "Calculus Textbook",
  description: "A clean calculus textbook with useful revision notes inside.",
  price: 2800,
  category: "Books",
  condition: "Good",
  campus: "Library",
  tags: ["calculus", "textbook"],
  images: [],
};

async function registerAndLogin(user = firstUser) {
  await request(app).post("/api/v1/auth/register").send(user).expect(201);
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: user.email, password: user.password })
    .expect(200);
  return response.body.data.token as string;
}

async function approveListing(id: string) {
  await ListingModel.findByIdAndUpdate(id, {
    verificationStatus: "Verified",
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

describe("cart and checkout API", () => {
  it("adds an available listing, removes it, and prevents buying your own listing", async () => {
    const sellerToken = await registerAndLogin(firstUser);
    const listing = await request(app).post("/api/v1/listings").set("Authorization", `Bearer ${sellerToken}`).send(validListing).expect(201);
    await approveListing(listing.body.data.id);
    await request(app).post(`/api/v1/cart/${listing.body.data.id}`).set("Authorization", `Bearer ${sellerToken}`).expect(400);

    const buyerToken = await registerAndLogin(secondUser);
    const added = await request(app).post(`/api/v1/cart/${listing.body.data.id}`).set("Authorization", `Bearer ${buyerToken}`).expect(201);
    expect(added.body.data.items).toHaveLength(1);
    const cartNotifications = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${buyerToken}`).expect(200);
    expect(cartNotifications.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "cart", read: false }),
      ])
    );
    const cartNotification = cartNotifications.body.data.find(
      (item: { type: string }) => item.type === "cart"
    );
    await request(app)
      .patch(`/api/v1/notifications/${cartNotification.id}/read`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    const removed = await request(app).delete(`/api/v1/cart/${listing.body.data.id}`).set("Authorization", `Bearer ${buyerToken}`).expect(200);
    expect(removed.body.data.items).toHaveLength(0);
  });

  it("creates a pending order and returns a signed eSewa handoff", async () => {
    const sellerToken = await registerAndLogin(firstUser);
    const listing = await request(app).post("/api/v1/listings").set("Authorization", `Bearer ${sellerToken}`).send(validListing).expect(201);
    await approveListing(listing.body.data.id);
    const buyerToken = await registerAndLogin(secondUser);
    await request(app).post(`/api/v1/cart/${listing.body.data.id}`).set("Authorization", `Bearer ${buyerToken}`).expect(201);
    const order = await request(app).post("/api/v1/cart/checkout").set("Authorization", `Bearer ${buyerToken}`).send({
      billingAddress: {
        fullName: "Aarav Student",
        email: "aarav.student@example.test",
        phone: "9800000000",
        addressLine1: "Student Union",
        city: "Kathmandu",
        region: "Bagmati",
        postalCode: "44600",
      },
    }).expect(201);
    expect(order.body.data.paymentUrl).toBe("https://rc-epay.esewa.com.np/api/epay/main/v2/form");
    expect(order.body.data.fields.product_code).toBe("EPAYTEST");
    expect(order.body.data.fields.total_amount).toBe(validListing.price.toFixed(2));
    expect(order.body.data.fields.transaction_uuid).toMatch(/^CC-/);
    expect(order.body.data.fields.signature).toBeTruthy();
    expect(order.body.data.fields.success_url).toBe("http://localhost:3000/payment/esewa/success");
    const statusRequest = jest.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      product_code: "EPAYTEST",
      transaction_uuid: order.body.data.fields.transaction_uuid,
      total_amount: validListing.price,
      status: "PENDING",
      ref_id: null,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const paymentStatus = await request(app)
      .get(`/api/v1/cart/checkout/esewa/status?transaction_uuid=${order.body.data.fields.transaction_uuid}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    expect(paymentStatus.body.data.status).toBe("PENDING");
    statusRequest.mockRestore();
    const cart = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${buyerToken}`).expect(200);
    expect(cart.body.data.items).toHaveLength(1);
    const available = await request(app).get(`/api/v1/listings/${listing.body.data.id}`).expect(200);
    expect(available.body.data.status).toBe("Active");
  });
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("authentication API", () => {
  it("registers a user without exposing a password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(firstUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(firstUser.email);
    expect(response.body.data.password).toBeUndefined();
  });

  it("rejects invalid registration data", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ fullName: "M", email: "invalid", password: "123" })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it("logs in a registered user and returns an authenticated identity", async () => {
    const token = await registerAndLogin();
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.email).toBe(firstUser.email);
  });

  it("rejects duplicate registration and incorrect login credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(firstUser).expect(201);
    await request(app).post("/api/v1/auth/register").send(firstUser).expect(409);
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: firstUser.email, password: "wrong-password" })
      .expect(401);
  });

  it("rejects missing, malformed, and invalid authentication tokens", async () => {
    await request(app).get("/api/v1/auth/me").expect(401);
    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Basic invalid")
      .expect(401);
    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  });

  it("updates profile details and password for an authenticated user", async () => {
    const token = await registerAndLogin();
    const profile = await request(app)
      .put("/api/v1/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Maya Updated")
      .field("phone", "9800000000")
      .field("address", "Main Campus")
      .expect(200);
    expect(profile.body.data.fullName).toBe("Maya Updated");

    await request(app)
      .put("/api/v1/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: firstUser.password,
        newPassword: "UpdatedPass123",
      })
      .expect(200);
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: firstUser.email, password: "UpdatedPass123" })
      .expect(200);
  });

  it("rejects invalid profile and password updates", async () => {
    const token = await registerAndLogin();
    await request(app)
      .put("/api/v1/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "M")
      .expect(400);
    await request(app)
      .put("/api/v1/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrong", newPassword: "123" })
      .expect(400);
    await request(app)
      .put("/api/v1/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrong", newPassword: "ValidPass123" })
      .expect(400);
  });

  it("logs out and clears the authentication cookie", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .expect(200);
    expect(response.headers["set-cookie"]?.[0]).toContain("token=");
  });

  it("uploads a valid profile image and rejects an invalid file type", async () => {
    const token = await registerAndLogin();
    const uploaded = await request(app)
      .put("/api/v1/auth/profile-picture")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePicture", Buffer.from("test-image"), {
        filename: "avatar.png",
        contentType: "image/png",
      })
      .expect(200);
    expect(uploaded.body.data.profilePicture).toContain("/uploads/profile_pics/");

    const uploadedPath = path.join(
      process.cwd(),
      uploaded.body.data.profilePicture.replace(/^\//, "")
    );
    await fs.unlink(uploadedPath);

    await request(app)
      .put("/api/v1/auth/profile-picture")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePicture", Buffer.from("not-an-image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      })
      .expect(400);
  });

  it("emails a one-time password reset link and accepts the new password", async () => {
    await request(app).post("/api/v1/auth/register").send(firstUser).expect(201);
    const requested = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: firstUser.email })
      .expect(200);
    const unknown = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "unknown@example.test" })
      .expect(200);
    expect(unknown.body.message).toBe(requested.body.message);
    expect(lastTestResetLink).toBeTruthy();
    const token = new URL(lastTestResetLink!).searchParams.get("token");
    expect(token).toBeTruthy();

    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token, newPassword: "NewSecurePass123" })
      .expect(200);
    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token, newPassword: "AnotherSecurePass123" })
      .expect(400);
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: firstUser.email, password: "NewSecurePass123" })
      .expect(200);
  });

  it("rejects expired password reset links and weak passwords", async () => {
    await request(app).post("/api/v1/auth/register").send(firstUser).expect(201);
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: firstUser.email })
      .expect(200);
    const token = new URL(lastTestResetLink!).searchParams.get("token");
    await PasswordResetTokenModel.updateMany(
      {},
      { expiresAt: new Date(Date.now() - 1000) }
    );
    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token, newPassword: "NewSecurePass123" })
      .expect(400);
    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "anything", newPassword: "short" })
      .expect(400);
  });

  it("supports the mobile OTP password reset flow without changing web reset links", async () => {
    await request(app).post("/api/v1/auth/register").send(firstUser).expect(201);
    const requested = await request(app)
      .post("/api/v1/auth/mobile/forgot-password")
      .send({ email: firstUser.email })
      .expect(200);
    const unknown = await request(app)
      .post("/api/v1/auth/mobile/forgot-password")
      .send({ email: "unknown@example.test" })
      .expect(200);
    expect(unknown.body.message).toBe(requested.body.message);
    expect(lastTestResetOtp).toMatch(/^\d{6}$/);

    await request(app)
      .post("/api/v1/auth/mobile/verify-reset-otp")
      .send({ email: firstUser.email, otp: "999999" })
      .expect(400);
    const verified = await request(app)
      .post("/api/v1/auth/mobile/verify-reset-otp")
      .send({ email: firstUser.email, otp: lastTestResetOtp })
      .expect(200);
    const resetToken = verified.body.data.resetToken as string;
    expect(resetToken).toHaveLength(64);

    await request(app)
      .post("/api/v1/auth/mobile/reset-password")
      .send({
        email: firstUser.email,
        resetToken,
        newPassword: "MobileSecurePass123",
      })
      .expect(200);
    await request(app)
      .post("/api/v1/auth/mobile/reset-password")
      .send({
        email: firstUser.email,
        resetToken,
        newPassword: "AnotherSecurePass123",
      })
      .expect(400);
    await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: firstUser.email,
        password: "MobileSecurePass123",
      })
      .expect(200);
  });
});

describe("listing API", () => {
  it("requires authentication to create a listing", async () => {
    await request(app)
      .post("/api/v1/listings")
      .send(validListing)
      .expect(401);
  });

  it("creates and retrieves a listing", async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing)
      .expect(201);

    expect(created.headers.location).toBe(
      `/api/v1/listings/${created.body.data.id}`
    );
    await approveListing(created.body.data.id);

    const fetched = await request(app)
      .get(`/api/v1/listings/${created.body.data.id}`)
      .expect(200);

    expect(fetched.body.data.title).toBe(validListing.title);
    expect(fetched.body.data.seller.email).toBeUndefined();
  });

  it("stores validated product images and returns their public paths", async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .field("title", validListing.title)
      .field("description", validListing.description)
      .field("price", String(validListing.price))
      .field("category", validListing.category)
      .field("condition", validListing.condition)
      .field("campus", validListing.campus)
      .field("tags", JSON.stringify(validListing.tags))
      .attach("images", Buffer.from("listing-image"), {
        filename: "product.png",
        contentType: "image/png",
      })
      .expect(201);

    expect(created.body.data.images).toHaveLength(1);
    expect(created.body.data.images[0]).toMatch(/^\/uploads\/listings\//);
    await fs.unlink(
      path.join(
        process.cwd(),
        (created.body.data.images[0] as string).replace(/^\//, "")
      )
    );

    await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .field("title", validListing.title)
      .field("description", validListing.description)
      .field("price", String(validListing.price))
      .field("category", validListing.category)
      .field("condition", validListing.condition)
      .field("campus", validListing.campus)
      .attach("images", Buffer.from("invalid"), {
        filename: "product.txt",
        contentType: "text/plain",
      })
      .expect(400);
  });

  it("rejects invalid listing data", async () => {
    const token = await registerAndLogin();
    const response = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validListing, title: "x", price: -5 })
      .expect(400);

    expect(response.body.message).toContain("title");
    expect(response.body.message).toContain("price");
  });

  it("supports search, filtering, sorting, and pagination", async () => {
    const token = await registerAndLogin();
    await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing)
      .expect(201);
    await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validListing,
        title: "Mechanical Keyboard",
        description: "A compact mechanical keyboard suitable for programming.",
        price: 7200,
        category: "Electronics",
        campus: "Engineering",
      })
      .expect(201);
    await ListingModel.updateMany({}, { verificationStatus: "Verified" });

    const response = await request(app)
      .get("/api/v1/listings")
      .query({
        search: "keyboard",
        category: "Electronics",
        campus: "Engineering",
        sort: "price-desc",
        page: 1,
        limit: 1,
      })
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe("Mechanical Keyboard");
    expect(response.body.data.pagination.total).toBe(1);
  });

  it("returns only the authenticated seller's listings", async () => {
    const firstToken = await registerAndLogin(firstUser);
    const secondToken = await registerAndLogin(secondUser);
    await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${firstToken}`)
      .send(validListing)
      .expect(201);
    await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ ...validListing, title: "Second Student Textbook" })
      .expect(201);

    const response = await request(app)
      .get("/api/v1/listings/mine")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe(validListing.title);
  });

  it("allows the owner to update and delete a listing", async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing)
      .expect(201);
    const id = created.body.data.id as string;

    const updated = await request(app)
      .put(`/api/v1/listings/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 2500, status: "Sold" })
      .expect(200);
    expect(updated.body.data.price).toBe(2500);
    expect(updated.body.data.status).toBe("Sold");

    await request(app)
      .delete(`/api/v1/listings/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await request(app).get(`/api/v1/listings/${id}`).expect(404);
  });

  it("prevents another user from updating or deleting a listing", async () => {
    const ownerToken = await registerAndLogin(firstUser);
    const otherToken = await registerAndLogin(secondUser);
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(validListing)
      .expect(201);
    const id = created.body.data.id as string;

    await request(app)
      .put(`/api/v1/listings/${id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ price: 1 })
      .expect(403);
    await request(app)
      .delete(`/api/v1/listings/${id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(403);
  });

  it("keeps draft listings out of public retrieval", async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validListing, status: "Draft" })
      .expect(201);

    await request(app)
      .get(`/api/v1/listings/${created.body.data.id}`)
      .expect(404);

    const mine = await request(app)
      .get("/api/v1/listings/mine")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(mine.body.data).toHaveLength(1);
  });

  it("returns safe validation errors for bad IDs, queries, and empty updates", async () => {
    const token = await registerAndLogin();
    await request(app).get("/api/v1/listings/not-an-id").expect(400);
    await request(app)
      .get("/api/v1/listings")
      .query({ page: 0, limit: 1000 })
      .expect(400);
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing)
      .expect(201);
    await request(app)
      .put(`/api/v1/listings/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);
  });
});

describe("application errors", () => {
  it("returns a structured response for an unknown route", async () => {
    const response = await request(app).get("/api/v1/unknown").expect(404);
    expect(response.body).toEqual({
      success: false,
      message: "Route not found",
    });
  });
});

describe("Flutter mobile compatibility", () => {
  it("supports the legacy /api auth path and Bearer-token session flow", async () => {
    await request(app).post("/api/auth/register").send(firstUser).expect(201);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: firstUser.email, password: firstUser.password })
      .expect(200);

    expect(login.body.data.user.email).toBe(firstUser.email);
    expect(typeof login.body.data.token).toBe("string");

    const currentUser = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .expect(200);
    expect(currentUser.body.data.fullName).toBe(firstUser.fullName);
  });

  it("supports listing CRUD through the unversioned mobile API path", async () => {
    await request(app).post("/api/auth/register").send(firstUser).expect(201);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: firstUser.email, password: firstUser.password })
      .expect(200);
    const token = login.body.data.token as string;

    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${token}`)
      .send(validListing)
      .expect(201);
    const id = created.body.data.id as string;
    await approveListing(id);

    await request(app).get(`/api/listings/${id}`).expect(200);
    await request(app)
      .put(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 2600 })
      .expect(200);
    await request(app)
      .delete(`/api/listings/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});

describe("saved listings API", () => {
  it("saves, lists, avoids duplicates, and removes a listing", async () => {
    const sellerToken = await registerAndLogin(firstUser);
    const buyerToken = await registerAndLogin(secondUser);
    const created = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send(validListing)
      .expect(201);
    const id = created.body.data.id as string;
    await approveListing(id);

    await request(app)
      .post(`/api/v1/saved/${id}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(201);
    await request(app)
      .post(`/api/v1/saved/${id}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(201);

    const saved = await request(app)
      .get("/api/v1/saved")
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    expect(saved.body.data).toHaveLength(1);
    expect(saved.body.data[0].id).toBe(id);
    const notifications = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    expect(notifications.body.data.filter((item: { type: string }) => item.type === "saved")).toHaveLength(1);

    await request(app)
      .delete(`/api/v1/saved/${id}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    await request(app)
      .delete(`/api/v1/saved/${id}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(404);
  });

  it("requires authentication and validates the listing", async () => {
    await request(app).get("/api/v1/saved").expect(401);
    const token = await registerAndLogin();
    await request(app)
      .post("/api/v1/saved/not-an-id")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});

describe("conversations and messages API", () => {
  async function conversationFixture() {
    const sellerToken = await registerAndLogin(firstUser);
    const buyerToken = await registerAndLogin(secondUser);
    const listing = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send(validListing)
      .expect(201);
    await approveListing(listing.body.data.id);
    const created = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ listingId: listing.body.data.id })
      .expect(201);
    return {
      sellerToken,
      buyerToken,
      listingId: listing.body.data.id as string,
      conversationId: created.body.data.id as string,
    };
  }

  it("opens one conversation per buyer and listing", async () => {
    const fixture = await conversationFixture();
    const repeated = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${fixture.buyerToken}`)
      .send({ listingId: fixture.listingId })
      .expect(201);
    expect(repeated.body.data.id).toBe(fixture.conversationId);

    const conversations = await request(app)
      .get("/api/v1/conversations")
      .set("Authorization", `Bearer ${fixture.buyerToken}`)
      .expect(200);
    expect(conversations.body.data).toHaveLength(1);
    expect(conversations.body.data[0].listing.id).toBe(fixture.listingId);
  });

  it("sends messages, rejects empty messages, and updates unread state", async () => {
    const fixture = await conversationFixture();
    await request(app)
      .post(`/api/v1/conversations/${fixture.conversationId}/messages`)
      .set("Authorization", `Bearer ${fixture.buyerToken}`)
      .send({ body: "  Is this still available?  " })
      .expect(201);
    await request(app)
      .post(`/api/v1/conversations/${fixture.conversationId}/messages`)
      .set("Authorization", `Bearer ${fixture.buyerToken}`)
      .send({ body: "   " })
      .expect(400);

    const sellerRooms = await request(app)
      .get("/api/v1/conversations")
      .set("Authorization", `Bearer ${fixture.sellerToken}`)
      .expect(200);
    expect(sellerRooms.body.data[0].unreadCount).toBe(1);

    await request(app)
      .patch(`/api/v1/conversations/${fixture.conversationId}/read`)
      .set("Authorization", `Bearer ${fixture.sellerToken}`)
      .expect(200);
    const messages = await request(app)
      .get(`/api/v1/conversations/${fixture.conversationId}/messages`)
      .set("Authorization", `Bearer ${fixture.sellerToken}`)
      .expect(200);
    expect(messages.body.data[0].body).toBe("Is this still available?");
    expect(messages.body.data[0].read).toBe(true);
  });

  it("prevents sellers messaging themselves and outsiders reading chats", async () => {
    const sellerToken = await registerAndLogin(firstUser);
    const listing = await request(app)
      .post("/api/v1/listings")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send(validListing)
      .expect(201);
    await approveListing(listing.body.data.id);
    await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ listingId: listing.body.data.id })
      .expect(400);

    const buyerToken = await registerAndLogin(secondUser);
    const conversation = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ listingId: listing.body.data.id })
      .expect(201);
    const outsider = await registerAndLogin({
      fullName: "Third Student",
      email: "third@example.test",
      password: "SecurePass789",
    });
    await request(app)
      .get(`/api/v1/conversations/${conversation.body.data.id}/messages`)
      .set("Authorization", `Bearer ${outsider}`)
      .expect(403);
  });
});
