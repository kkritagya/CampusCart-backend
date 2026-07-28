import { describe, expect, it } from "@jest/globals";
import { createListingSchema, listingQuerySchema } from "../../src/dtos/listing.dto";
import { validateLoginDto, validateRegisterDto } from "../../src/dtos/user.dto";

const validListing = {
  title: "Calculus Textbook",
  description: "A well-kept textbook containing useful revision notes.",
  price: 1500,
  category: "Books",
  condition: "Good",
  campus: "Library",
};

describe("registration DTO boundaries", () => {
  const invalidCases: Array<[string, Record<string, unknown>, string]> = [
    ["empty body", {}, "Full name must be at least 2 characters"],
    ["missing name", { email: "a@b.test", password: "secret" }, "Full name must be at least 2 characters"],
    ["empty name", { fullName: "", email: "a@b.test", password: "secret" }, "Full name must be at least 2 characters"],
    ["space-only name", { fullName: "   ", email: "a@b.test", password: "secret" }, "Full name must be at least 2 characters"],
    ["one-letter name", { fullName: "A", email: "a@b.test", password: "secret" }, "Full name must be at least 2 characters"],
    ["missing email", { fullName: "Ada", password: "secret" }, "A valid email is required"],
    ["empty email", { fullName: "Ada", email: "", password: "secret" }, "A valid email is required"],
    ["email without at-sign", { fullName: "Ada", email: "example.test", password: "secret" }, "A valid email is required"],
    ["email without domain", { fullName: "Ada", email: "ada@", password: "secret" }, "A valid email is required"],
    ["email without suffix", { fullName: "Ada", email: "ada@example", password: "secret" }, "A valid email is required"],
    ["email containing spaces", { fullName: "Ada", email: "ada @example.test", password: "secret" }, "A valid email is required"],
    ["missing password", { fullName: "Ada", email: "ada@example.test" }, "Password must be at least 6 characters"],
    ["empty password", { fullName: "Ada", email: "ada@example.test", password: "" }, "Password must be at least 6 characters"],
    ["five-character password", { fullName: "Ada", email: "ada@example.test", password: "12345" }, "Password must be at least 6 characters"],
  ];

  it.each(invalidCases)("rejects %s", (_name, input, message) => {
    expect(validateRegisterDto(input)).toBe(message);
  });

  const validCases: Array<[string, Record<string, unknown>]> = [
    ["two-letter name", { fullName: "Al", email: "al@example.test", password: "123456" }],
    ["trimmed name", { fullName: "  Ada  ", email: "ada@example.test", password: "secret" }],
    ["trimmed email", { fullName: "Ada", email: "  ada@example.test  ", password: "secret" }],
    ["plus-address email", { fullName: "Ada", email: "ada+shop@example.test", password: "secret" }],
    ["subdomain email", { fullName: "Ada", email: "ada@mail.example.test", password: "secret" }],
    ["long password", { fullName: "Ada", email: "ada@example.test", password: "a".repeat(128) }],
  ];

  it.each(validCases)("accepts %s", (_name, input) => {
    expect(validateRegisterDto(input)).toBeNull();
  });
});

describe("login DTO boundaries", () => {
  const cases: Array<[string, Record<string, unknown>, string | null]> = [
    ["empty body", {}, "A valid email is required"],
    ["empty email", { email: "", password: "secret" }, "A valid email is required"],
    ["space-only email", { email: "  ", password: "secret" }, "A valid email is required"],
    ["email without local part", { email: "@example.test", password: "secret" }, "A valid email is required"],
    ["email without at-sign", { email: "ada.example.test", password: "secret" }, "A valid email is required"],
    ["email without suffix", { email: "ada@example", password: "secret" }, "A valid email is required"],
    ["missing password", { email: "ada@example.test" }, "Password is required"],
    ["empty password", { email: "ada@example.test", password: "" }, "Password is required"],
    ["one-character password", { email: "ada@example.test", password: "x" }, null],
    ["trimmed valid email", { email: " ada@example.test ", password: "secret" }, null],
  ];

  it.each(cases)("%s", (_name, input, message) => {
    expect(validateLoginDto(input)).toBe(message);
  });
});

describe("listing DTO boundaries", () => {
  const cases: Array<[string, Record<string, unknown>, boolean]> = [
    ["three-character title", { ...validListing, title: "Book" }, true],
    ["two-character title", { ...validListing, title: "AB" }, false],
    ["eighty-character title", { ...validListing, title: "a".repeat(80) }, true],
    ["eighty-one-character title", { ...validListing, title: "a".repeat(81) }, false],
    ["twenty-character description", { ...validListing, description: "a".repeat(20) }, true],
    ["nineteen-character description", { ...validListing, description: "a".repeat(19) }, false],
    ["maximum price", { ...validListing, price: 100_000_000 }, true],
    ["price above maximum", { ...validListing, price: 100_000_001 }, false],
    ["negative price", { ...validListing, price: -1 }, false],
    ["six images", { ...validListing, images: Array(6).fill("image.png") }, true],
    ["seven images", { ...validListing, images: Array(7).fill("image.png") }, false],
  ];

  it.each(cases)("%s", (_name, input, expected) => {
    expect(createListingSchema.safeParse(input).success).toBe(expected);
  });

  const queryCases: Array<[string, Record<string, unknown>, boolean]> = [
    ["first page", { page: 1 }, true],
    ["zero page", { page: 0 }, false],
    ["fractional page", { page: 1.5 }, false],
    ["maximum limit", { limit: 50 }, true],
  ];

  it.each(queryCases)("query accepts/rejects %s", (_name, input, expected) => {
    expect(listingQuerySchema.safeParse(input).success).toBe(expected);
  });
});
