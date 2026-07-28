import { Document, Types } from "mongoose";

export const listingCategories = [
  "Electronics",
  "Books",
  "Furniture",
  "Clothing",
  "Sports",
  "Other",
] as const;

export const listingConditions = ["New", "Like New", "Good", "Fair"] as const;
export const listingCampuses = [
  "Main Campus",
  "Library",
  "Engineering",
  "Student Union",
  "North Campus",
  "South Campus",
] as const;
export const listingStatuses = ["Active", "Sold", "Draft"] as const;

export type ListingCategory = (typeof listingCategories)[number];
export type ListingCondition = (typeof listingConditions)[number];
export type ListingCampus = (typeof listingCampuses)[number];
export type ListingStatus = (typeof listingStatuses)[number];
export type ListingVerificationStatus = "Pending" | "Verified" | "Rejected";

export interface IListing {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  campus: ListingCampus;
  status: ListingStatus;
  verificationStatus?: ListingVerificationStatus;
  moderationReason?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  tags: string[];
  images: string[];
  seller: Types.ObjectId;
  views: number;
  enquiries: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IListingDocument extends IListing, Document {
  _id: Types.ObjectId;
}

export interface ListingResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  campus: ListingCampus;
  status: ListingStatus;
  verificationStatus: ListingVerificationStatus;
  moderationReason?: string;
  moderatedAt?: Date;
  tags: string[];
  images: string[];
  seller: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
  views: number;
  enquiries: number;
  createdAt?: Date;
  updatedAt?: Date;
}
