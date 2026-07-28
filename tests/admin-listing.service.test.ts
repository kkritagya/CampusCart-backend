import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { ListingModel } from "../src/models/listing.model";
import { NotificationModel } from "../src/models/notification.model";
import { UserModel } from "../src/models/user.model";
import { moderateListing } from "../src/services/admin-listing.service";

let mongo: MongoMemoryServer;

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

async function fixture() {
  const [seller, admin] = await UserModel.create([
    {
      fullName: "Student Seller",
      email: "seller@example.test",
      password: "hashed-password",
    },
    {
      fullName: "Campus Admin",
      email: "admin@example.test",
      password: "hashed-password",
      role: "admin",
    },
  ]);
  const listing = await ListingModel.create({
    title: "Calculus Textbook",
    description: "A clean textbook in good condition.",
    price: 1200,
    category: "Books",
    condition: "Good",
    campus: "Main Campus",
    status: "Active",
    seller: seller._id,
  });
  return { seller, admin, listing };
}

describe("listing moderation notifications", () => {
  it("notifies the seller when a listing is approved", async () => {
    const { seller, admin, listing } = await fixture();

    await moderateListing(
      listing._id.toString(),
      admin._id.toString(),
      "Verified"
    );

    const notification = await NotificationModel.findOne({
      recipient: seller._id,
    }).lean();
    expect(notification).toMatchObject({
      type: "moderation",
      title: "Listing approved",
      href: `/marketplace/${listing._id}`,
      read: false,
    });
    expect(notification?.body).toContain("Calculus Textbook");
  });

  it("includes the rejection reason and edit link in the seller notification", async () => {
    const { seller, admin, listing } = await fixture();

    await moderateListing(
      listing._id.toString(),
      admin._id.toString(),
      "Rejected",
      "Please add a clear photo of the book."
    );

    const notification = await NotificationModel.findOne({
      recipient: seller._id,
    }).lean();
    expect(notification).toMatchObject({
      type: "moderation",
      title: "Listing needs changes",
      href: `/dashboard/listings/${listing._id}/edit`,
      read: false,
    });
    expect(notification?.body).toContain(
      "Please add a clear photo of the book."
    );
  });
});
