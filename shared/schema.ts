import { pgTable, text, serial, integer, boolean, timestamp, json, unique, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema for all user types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["customer", "owner", "admin", "partner"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: text("status", { enum: ["active", "blocked", "pending"] }).default("active").notNull(),
  blockReason: text("block_reason"),
  profilePicture: text("profile_picture"),
});

// Customer specific details
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  address: text("address"),
  phone: text("phone"),
});

// Restaurant owner specific details
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone"),
});

// Delivery partner specific details
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  vehicleName: text("vehicle_name").notNull(),
  vehicleColor: text("vehicle_color").notNull(),
  vehicleNumber: text("vehicle_number").notNull(),
  licenseNumber: text("license_number").notNull(),
  licensePhoto: text("license_photo"),
  billbookPhoto: text("billbook_photo"),
  status: text("status", { enum: ["available", "busy", "offline"] }).default("available"),
});

// Restaurant schema
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  photo: text("photo"),
  status: text("status", { enum: ["open", "closed", "busy", "pending", "rejected"] }).default("pending"),
  category: text("category").array(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  blockReason: text("block_reason"),
});

// Food items schema
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  photo: text("photo"),
  category: text("category").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  partnerId: integer("partner_id").references(() => partners.id),
  status: text("status", { enum: ["pending", "processing", "preparing", "ready", "picked", "delivered", "cancelled"] }).default("pending"),
  total: integer("total").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "esewa", "khalti"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  estimatedDeliveryTime: integer("estimated_delivery_time"),
  actualDeliveryTime: integer("actual_delivery_time"),
  cancelReason: text("cancel_reason"),
});

// Order items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  foodItemId: integer("food_item_id").notNull().references(() => foodItems.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, status: true, blockReason: true });

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true });
export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, status: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, createdAt: true, updatedAt: true, rating: true, status: true, blockReason: true });
export const insertFoodItemSchema = createInsertSchema(foodItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, estimatedDeliveryTime: true, actualDeliveryTime: true, cancelReason: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// Custom schemas for forms
export const customerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  name: z.string().min(2),
  age: z.string().transform((val) => parseInt(val, 10)),
  gender: z.enum(["male", "female", "other"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const restaurantRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  name: z.string().min(2),
  restaurantName: z.string().min(2),
  location: z.string().min(2),
  phone: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const partnerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  name: z.string().min(2),
  phone: z.string(),
  vehicleName: z.string(),
  vehicleColor: z.string(),
  vehicleNumber: z.string(),
  licenseNumber: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Select Types
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Owner = typeof owners.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type FoodItem = typeof foodItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Form Types
export type CustomerRegister = z.infer<typeof customerRegisterSchema>;
export type RestaurantRegister = z.infer<typeof restaurantRegisterSchema>;
export type PartnerRegister = z.infer<typeof partnerRegisterSchema>;
export type Login = z.infer<typeof loginSchema>;

// User with role
export type UserWithRole = User & (
  { role: "customer", customerDetails: Customer } |
  { role: "owner", ownerDetails: Owner, restaurant?: Restaurant } |
  { role: "partner", partnerDetails: Partner } |
  { role: "admin" }
);
