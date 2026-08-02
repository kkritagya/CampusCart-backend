"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestListing = suggestListing;
const http_exception_1 = require("../exceptions/http-exception");
const categories = ["Electronics", "Books", "Furniture", "Clothing", "Sports", "Other"];
const conditions = ["New", "Like New", "Good", "Fair"];
async function suggestListing(image, language) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new http_exception_1.HttpException(503, "AI listing assistance is not configured");
    }
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const languageName = language === "ne" ? "Nepali" : "English";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Analyze this second-hand marketplace product photo. Write the title and description in ${languageName}. ` +
                                "Do not invent a brand, model, specifications, or condition that cannot be seen. " +
                                "Estimate a reasonable Nepalese-rupee resale price, but make clear through conservative wording when details are uncertain.",
                        },
                        {
                            inlineData: {
                                mimeType: image.mimetype,
                                data: image.buffer.toString("base64"),
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "object",
                    additionalProperties: false,
                    required: ["title", "category", "description", "condition", "estimatedPriceNpr"],
                    properties: {
                        title: { type: "string", minLength: 3, maxLength: 100 },
                        category: { type: "string", enum: categories },
                        description: { type: "string", minLength: 20, maxLength: 1000 },
                        condition: { type: "string", enum: conditions },
                        estimatedPriceNpr: { type: "number", minimum: 0, maximum: 10000000 },
                    },
                },
            },
        }),
    });
    if (!response.ok) {
        const detail = await response.text();
        console.error("Gemini listing suggestion failed", response.status, detail);
        throw new http_exception_1.HttpException(502, "AI listing suggestion failed");
    }
    const payload = (await response.json());
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text)
        throw new http_exception_1.HttpException(502, "Gemini returned no listing suggestion");
    const parsed = JSON.parse(text);
    return parsed;
}
