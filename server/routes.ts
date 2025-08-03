import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertFoodItemSchema, insertOrderSchema, owners, customers, orders, orderItems, partners, restaurants } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const location = req.query.location as string | undefined;
      const restaurants = await storage.getRestaurants(location);
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  // Food items routes
  app.get("/api/restaurants/:id/foods", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const foods = await storage.getFoodItems(restaurantId);
      res.json(foods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.post("/api/restaurants/:id/foods", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const restaurantId = parseInt(req.params.id);
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      
      if (!restaurant || restaurant.id !== restaurantId) {
        return res.status(403).json({ message: "You don't own this restaurant" });
      }

      const validatedData = insertFoodItemSchema.parse({
        ...req.body,
        restaurantId
      });
      
      const foodItem = await storage.createFoodItem(validatedData);
      res.status(201).json(foodItem);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let orders;
      switch (req.user.role) {
        case "customer":
          orders = await storage.getCustomerOrders(req.user.id);
          break;
        case "owner":
          orders = await storage.getRestaurantOrders(req.user.id);
          break;
        case "partner":
          orders = await storage.getPartnerOrders(req.user.id);
          break;
        case "admin":
          orders = await storage.getAllOrders();
          break;
        default:
          return res.status(403).json({ message: "Invalid role" });
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });





  // Admin routes
  app.get("/api/admin/restaurants", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const status = req.query.status as string | undefined;
      const restaurants = await storage.getRestaurantsByStatus(status);
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.patch("/api/admin/restaurants/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const restaurantId = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      const restaurant = await storage.updateRestaurantStatus(restaurantId, status, reason);
      
      // If restaurant is approved (open), also activate the owner's user account
      if (["open", "closed", "busy"].includes(status)) {
        // Get the owner's user ID and activate their account
        const [owner] = await db.select().from(owners).where(eq(owners.id, restaurant.ownerId));
        if (owner) {
          await storage.updateUserStatus(owner.userId, "active");
        }
      }
      
      res.json(restaurant);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update restaurant status" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const role = req.query.role as string | undefined;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const userId = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      const user = await storage.updateUserStatus(userId, status, reason);
      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Profile management routes
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userWithDetails = await storage.getUserWithDetails(req.user.id);
      if (!userWithDetails) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(userWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { name, phone, address, age, gender, profilePicture } = req.body;
      
      const updatedUser = await storage.updateUserProfile(req.user.id, {
        name,
        phone,
        address,
        age,
        gender,
        profilePicture
      });
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Owner restaurant management routes
  app.get("/api/owner/restaurant", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.put("/api/owner/restaurant", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { name, location, photo, category } = req.body;
      
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const updatedRestaurant = await storage.updateRestaurant(restaurant.id, {
        name,
        location,
        photo,
        category
      });
      
      res.json(updatedRestaurant);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  // Food item management routes
  app.get("/api/restaurants/:id/food-items", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const foodItems = await storage.getFoodItems(restaurantId);
      res.json(foodItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.post("/api/owner/food-items", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { name, description, price, photo, category } = req.body;
      
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const foodItem = await storage.createFoodItem({
        restaurantId: restaurant.id,
        name,
        description,
        price: parseInt(price),
        photo,
        category
      });
      
      res.status(201).json(foodItem);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create food item" });
    }
  });

  app.put("/api/owner/food-items/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const foodItemId = parseInt(req.params.id);
      const { name, description, price, photo, category } = req.body;
      
      const updatedFoodItem = await storage.updateFoodItem(foodItemId, {
        name,
        description,
        price: parseInt(price),
        photo,
        category
      });
      
      res.json(updatedFoodItem);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update food item" });
    }
  });

  app.delete("/api/owner/food-items/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const foodItemId = parseInt(req.params.id);
      await storage.deleteFoodItem(foodItemId);
      res.json({ message: "Food item deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete food item" });
    }
  });

  // Customer routes - these are handled by the general restaurant routes above

  app.post("/api/owner/restaurant", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { name, location, photo, category } = req.body;
      
      // Check if restaurant already exists for this owner
      const existingRestaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant already exists for this owner" });
      }

      // Get the owner ID from the owners table
      const [owner] = await db.select().from(owners).where(eq(owners.userId, req.user.id));
      if (!owner) {
        return res.status(400).json({ message: "Owner profile not found" });
      }

      const restaurant = await storage.createRestaurant({
        ownerId: owner.id,
        name,
        location,
        photo,
        category
      });
      
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.put("/api/owner/restaurant/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const restaurantId = parseInt(req.params.id);
      const { name, location, photo, category } = req.body;
      
      // Verify ownership
      const restaurant = await storage.getRestaurantByOwnerId(req.user.id);
      if (!restaurant || restaurant.id !== restaurantId) {
        return res.status(403).json({ message: "You don't own this restaurant" });
      }

      const updatedRestaurant = await storage.updateRestaurant(restaurantId, {
        name,
        location,
        photo,
        category
      });
      
      res.json(updatedRestaurant);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  // Order management routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "customer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { restaurantId, items, total, deliveryFee, address, phone, paymentMethod } = req.body;
      

      
      // Validate required fields manually since insertOrderSchema expects partnerId which is optional
      if (!restaurantId || total === undefined || total === null || deliveryFee === undefined || deliveryFee === null || !address || !phone || !paymentMethod) {
        const missing = [];
        if (!restaurantId) missing.push("restaurantId");
        if (total === undefined || total === null) missing.push("total");
        if (deliveryFee === undefined || deliveryFee === null) missing.push("deliveryFee");
        if (!address) missing.push("address");
        if (!phone) missing.push("phone");
        if (!paymentMethod) missing.push("paymentMethod");
        
        return res.status(400).json({ 
          message: `Validation error: Required fields missing: ${missing.join(', ')}`
        });
      }
      
      // Validate payment method enum
      if (!["cash", "esewa", "khalti"].includes(paymentMethod)) {
        return res.status(400).json({ 
          message: `Validation error: paymentMethod must be one of: cash, esewa, khalti`
        });
      }
      
      // Get customer ID
      const [customer] = await db.select().from(customers).where(eq(customers.userId, req.user.id));
      if (!customer) {
        return res.status(400).json({ message: "Customer profile not found" });
      }

      // Ensure delivery fee is at least 50
      const finalDeliveryFee = Math.max(parseInt(deliveryFee) || 50, 50);
      const finalTotal = parseInt(total) || (finalDeliveryFee);

      console.log("Creating order with data:", {
        customerId: customer.id,
        restaurantId: parseInt(restaurantId),
        total: finalTotal,
        deliveryFee: finalDeliveryFee,
        address: address.trim(),
        phone: phone.trim(),
        paymentMethod: paymentMethod
      });

      // Create order with validated data
      const [order] = await db.insert(orders).values({
        customerId: customer.id,
        restaurantId: parseInt(restaurantId),
        total: finalTotal,
        deliveryFee: finalDeliveryFee,
        address: address.trim(),
        phone: phone.trim(),
        paymentMethod: paymentMethod as any,
        status: "pending"
      }).returning();

      // Create order items
      if (items && items.length > 0) {
        for (const item of items) {
          const orderItemData = {
            orderId: order.id,
            foodItemId: parseInt(item.foodItemId),
            quantity: parseInt(item.quantity),
            price: parseInt(item.price)
          };
          console.log("Inserting order item:", orderItemData);
          await db.insert(orderItems).values(orderItemData);
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/customer/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "customer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const [customer] = await db.select().from(customers).where(eq(customers.userId, req.user.id));
      if (!customer) {
        return res.status(400).json({ message: "Customer profile not found" });
      }

      const ordersList = await storage.getCustomerOrders(customer.id);
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/owner/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const ordersList = await storage.getRestaurantOrders(req.user.id);
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/partner/available-orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "partner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Get orders that are ready for pickup (status = 'ready' and no partner assigned)
      // Include restaurant information for delivery partners
      const ordersList = await db
        .select({
          id: orders.id,
          customerId: orders.customerId,
          restaurantId: orders.restaurantId,
          status: orders.status,
          total: orders.total,
          deliveryFee: orders.deliveryFee,
          address: orders.address,
          phone: orders.phone,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          restaurantName: restaurants.name,
          restaurantLocation: restaurants.location,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(and(eq(orders.status, "ready"), isNull(orders.partnerId)))
        .orderBy(desc(orders.updatedAt));
      
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  app.get("/api/partner/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "partner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const ordersList = await storage.getPartnerOrders(req.user.id);
      res.json(ordersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      // For partners accepting orders, we need to assign them to the order
      if (req.user.role === "partner" && status === "picked") {
        // Get partner ID from partners table
        const [partner] = await db.select().from(partners).where(eq(partners.userId, req.user.id));
        if (!partner) {
          return res.status(400).json({ message: "Partner profile not found" });
        }

        // Update order with partner assignment and status
        const [updatedOrder] = await db
          .update(orders)
          .set({ 
            status: status as any,
            partnerId: partner.id,
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId))
          .returning();

        res.json(updatedOrder);
      } else {
        // Use existing storage method for other roles
        const updatedOrder = await storage.updateOrderStatus(
          orderId, 
          status, 
          req.user.id, 
          req.user.role, 
          reason
        );
        
        res.json(updatedOrder);
      }
    } catch (error) {
      console.error("Order status update error:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Partner routes
  app.patch("/api/partners/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "partner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const { status } = req.body;
      const partner = await storage.updatePartnerStatus(req.user.id, status);
      res.json(partner);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update partner status" });
    }
  });

  // Profile password change route
  app.put("/api/profile/password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      // Password change logic here
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update password" });
    }
  });



  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
