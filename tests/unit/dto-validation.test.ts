import { describe, expect, it } from "@jest/globals";
import {
  validateLoginDto,
  validateRegisterDto,
} from "../../src/dtos/user.dto";
import {
  createListingSchema,
  formatZodError,
  listingQuerySchema,
  updateListingSchema,
} from "../../src/dtos/listing.dto";

const listing = {
  title: "Calculus Textbook",
  description: "A clean textbook with useful revision notes.",
  price: 1500,
  category: "Books",
  condition: "Good",
  campus: "Library",
};

describe("user DTO validation", () => {
  it("accepts valid registration details", () => {
    expect(
      validateRegisterDto({
        fullName: "Maya Student",
        email: "maya@example.test",
        password: "secret1",
      })
    ).toBeNull();
  });

  it("rejects a missing full name", () => {
    expect(validateRegisterDto({ email: "maya@example.test", password: "secret1" }))
      .toBe("Full name must be at least 2 characters");
  });

  it("rejects a one-character full name", () => {
    expect(validateRegisterDto({ fullName: "M", email: "maya@example.test", password: "secret1" }))
      .toBe("Full name must be at least 2 characters");
  });

  it("rejects an invalid registration email", () => {
    expect(validateRegisterDto({ fullName: "Maya", email: "invalid", password: "secret1" }))
      .toBe("A valid email is required");
  });

  it("rejects a short registration password", () => {
    expect(validateRegisterDto({ fullName: "Maya", email: "maya@example.test", password: "123" }))
      .toBe("Password must be at least 6 characters");
  });

  it("accepts valid login details", () => {
    expect(validateLoginDto({ email: "maya@example.test", password: "secret1" }))
      .toBeNull();
  });

  it("rejects an invalid login email", () => {
    expect(validateLoginDto({ email: "invalid", password: "secret1" }))
      .toBe("A valid email is required");
  });

  it("rejects a missing login password", () => {
    expect(validateLoginDto({ email: "maya@example.test" }))
      .toBe("Password is required");
  });
});

describe("listing DTO validation", () => {
  it("accepts a valid listing", () => {
    expect(createListingSchema.safeParse(listing).success).toBe(true);
  });

  it("defaults optional listing collections", () => {
    const result = createListingSchema.parse(listing);
    expect(result.tags).toEqual([]);
    expect(result.images).toEqual([]);
  });

  it("defaults a new listing to active", () => {
    expect(createListingSchema.parse(listing).status).toBe("Active");
  });

  it("trims listing text", () => {
    const result = createListingSchema.parse({
      ...listing,
      title: "  Calculus Textbook  ",
    });
    expect(result.title).toBe("Calculus Textbook");
  });

  it("coerces a numeric price string", () => {
    expect(createListingSchema.parse({ ...listing, price: "1500" }).price)
      .toBe(1500);
  });

  it("rejects a title shorter than three characters", () => {
    expect(createListingSchema.safeParse({ ...listing, title: "A" }).success)
      .toBe(false);
  });

  it("rejects a short description", () => {
    expect(createListingSchema.safeParse({ ...listing, description: "Too short" }).success)
      .toBe(false);
  });

  it("rejects a zero price", () => {
    expect(createListingSchema.safeParse({ ...listing, price: 0 }).success)
      .toBe(false);
  });

  it("rejects an unsupported category", () => {
    expect(createListingSchema.safeParse({ ...listing, category: "Vehicles" }).success)
      .toBe(false);
  });

  it("rejects more than six images", () => {
    expect(
      createListingSchema.safeParse({
        ...listing,
        images: Array.from({ length: 7 }, (_, index) => `image-${index}.png`),
      }).success
    ).toBe(false);
  });

  it("accepts a partial listing update", () => {
    expect(updateListingSchema.safeParse({ price: 2000 }).success).toBe(true);
  });

  it("rejects an empty listing update", () => {
    expect(updateListingSchema.safeParse({}).success).toBe(false);
  });

  it("applies listing query defaults", () => {
    expect(listingQuerySchema.parse({})).toMatchObject({
      status: "Active",
      sort: "newest",
      page: 1,
      limit: 12,
    });
  });

  it("coerces pagination and price query values", () => {
    expect(
      listingQuerySchema.parse({ page: "2", limit: "20", minPrice: "100" })
    ).toMatchObject({ page: 2, limit: 20, minPrice: 100 });
  });

  it("rejects a page size above fifty", () => {
    expect(listingQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("formats validation errors with field names", () => {
    const result = createListingSchema.safeParse({ ...listing, price: -1 });
    if (result.success) throw new Error("Expected validation to fail");
    expect(formatZodError(result.error)).toContain("price:");
  });
});
