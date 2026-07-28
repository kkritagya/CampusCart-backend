import { QueryFilter, SortOrder, Types } from "mongoose";
import { ListingQueryDto } from "../dtos/listing.dto";
import { ListingModel } from "../models/listing.model";
import { IListing, IListingDocument } from "../types/listing.type";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(query: ListingQueryDto): QueryFilter<IListingDocument> {
  const filter: QueryFilter<IListingDocument> = {
    status: query.status,
    verificationStatus: "Verified",
  };

  if (query.search) {
    const expression = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { title: expression },
      { description: expression },
      { tags: expression },
    ];
  }
  if (query.category) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;
  if (query.campus) filter.campus = query.campus;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }

  return filter;
}

function buildSort(sort: ListingQueryDto["sort"]): Record<string, SortOrder> {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "price-asc") return { price: 1, createdAt: -1 };
  if (sort === "price-desc") return { price: -1, createdAt: -1 };
  return { createdAt: -1 };
}

export const createListingRecord = (
  listing: Omit<IListing, "views" | "enquiries">
): Promise<IListingDocument> => ListingModel.create(listing);

export const findListings = async (query: ListingQueryDto) => {
  const filter = buildFilter(query);
  const [items, total] = await Promise.all([
    ListingModel.find(filter)
      .sort(buildSort(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    ListingModel.countDocuments(filter),
  ]);
  return { items, total };
};

export const findListingsBySeller = (sellerId: string) =>
  ListingModel.find({ seller: new Types.ObjectId(sellerId) }).sort({
    createdAt: -1,
  });

export const findListingById = (id: string) => ListingModel.findById(id);

export const updateListingRecord = (
  id: string,
  update: Partial<IListing>
) => ListingModel.findByIdAndUpdate(id, update, {
  returnDocument: "after",
  runValidators: true,
});

export const deleteListingRecord = (id: string) =>
  ListingModel.findByIdAndDelete(id);
