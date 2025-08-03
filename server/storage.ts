import { 
  User, InsertUser, Customer, InsertCustomer, Owner, InsertOwner, 
  Partner, InsertPartner, Restaurant, InsertRestaurant, FoodItem, 
  InsertFoodItem, Order, InsertOrder, OrderItem, InsertOrderItem,
  UserWithRole,
  users, owners, customers, partners, restaurants, foodItems, orders, orderItems
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithDetails(id: number): Promise<UserWithRole | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: string, reason?: string): Promise<User>;
  updateUserProfile(id: number, data: { name?: string; phone?: string; address?: string; age?: number; gender?: string; profilePicture?: string }): Promise<UserWithRole>;
  getUsersByRole(role?: string): Promise<User[]>;
  
  // Role-specific user management
  createCustomer(data: { email: string; password: string; name: string; role: string; age?: number; gender?: string }): Promise<UserWithRole>;
  createOwner(data: { email: string; password: string; name: string; role: string; phone?: string; restaurantName: string; location: string; status?: string }): Promise<UserWithRole>;
  createPartner(data: { email: string; password: string; name: string; role: string; phone: string; vehicleName: string; vehicleColor: string; vehicleNumber: string; licenseNumber: string }): Promise<UserWithRole>;
  
  // Restaurant management
  getRestaurants(location?: string): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantByOwnerId(ownerId: number): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, data: { name?: string; location?: string; photo?: string; category?: string[] }): Promise<Restaurant>;
  updateRestaurantStatus(id: number, status: string, reason?: string): Promise<Restaurant>;
  getRestaurantsByStatus(status?: string): Promise<Restaurant[]>;
  
  // Food items management
  getFoodItems(restaurantId: number): Promise<FoodItem[]>;
  createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem>;
  
  // Order management
  getCustomerOrders(customerId: number): Promise<Order[]>;
  getRestaurantOrders(ownerId: number): Promise<Order[]>;
  getPartnerOrders(partnerId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, userId: number, role: string, reason?: string): Promise<Order>;
  
  // Partner management
  updatePartnerStatus(partnerId: number, status: string): Promise<Partner>;
  
  // Food item management
  updateFoodItem(id: number, data: { name?: string; description?: string; price?: number; photo?: string; category?: string[] }): Promise<FoodItem>;
  deleteFoodItem(id: number): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private owners: Map<number, Owner>;
  private partners: Map<number, Partner>;
  private restaurants: Map<number, Restaurant>;
  private foodItems: Map<number, FoodItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  
  private userId: number = 1;
  private customerId: number = 1;
  private ownerId: number = 1;
  private partnerId: number = 1;
  private restaurantId: number = 1;
  private foodItemId: number = 1;
  private orderId: number = 1;
  private orderItemId: number = 1;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // One day
    });
    
    this.users = new Map();
    this.customers = new Map();
    this.owners = new Map();
    this.partners = new Map();
    this.restaurants = new Map();
    this.foodItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    // Seed admin users
    this.seedAdmins();
  }

  private seedAdmins() {
    const admins = [
      { username: "Diwin Paudel", email: "diwin@foodexpress.com", password: "Diwin@022321" },
      { username: "Anupama Singh", email: "anupama@foodexpress.com", password: "Anupama@022310" },
      { username: "Shaivi Sharma", email: "shaivi@foodexpress.com", password: "Shaivi@022336" }
    ];
    
    for (const admin of admins) {
      const user: User = {
        id: this.userId++,
        email: admin.email,
        password: admin.password, // In a real app, these would be hashed
        name: admin.username,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
        blockReason: null,
        profilePicture: null,
      };
      
      this.users.set(user.id, user);
    }
  }

  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserWithDetails(id: number): Promise<UserWithRole | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    switch (user.role) {
      case "customer": {
        const customerDetails = await this.getCustomerByUserId(id);
        if (!customerDetails) return undefined;
        
        return {
          ...user,
          role: "customer",
          customerDetails
        };
      }
      case "owner": {
        const ownerDetails = await this.getOwnerByUserId(id);
        if (!ownerDetails) return undefined;
        
        const restaurant = await this.getRestaurantByOwnerId(ownerDetails.id);
        
        return {
          ...user,
          role: "owner",
          ownerDetails,
          restaurant
        };
      }
      case "partner": {
        const partnerDetails = await this.getPartnerByUserId(id);
        if (!partnerDetails) return undefined;
        
        return {
          ...user,
          role: "partner",
          partnerDetails
        };
      }
      case "admin":
        return {
          ...user,
          role: "admin"
        };
      default:
        return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      blockReason: null,
      profilePicture: user.profilePicture || null
    };
    
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserStatus(id: number, status: string, reason?: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    user.status = status as any;
    user.blockReason = reason || null;
    user.updatedAt = new Date();
    
    this.users.set(id, user);
    return user;
  }

  async getUsersByRole(role?: string): Promise<User[]> {
    const users = Array.from(this.users.values());
    
    if (!role) {
      return users;
    }
    
    return users.filter(user => user.role === role);
  }

  // Role-specific user creation methods
  async createCustomer(data: { email: string; password: string; name: string; role: string; age?: number; gender?: string }): Promise<UserWithRole> {
    const { email, password, name, role, age, gender } = data;
    
    // Create user
    const user = await this.createUser({
      email,
      password,
      name,
      role: role as "customer" | "owner" | "admin" | "partner"
    });
    
    // Create customer
    const id = this.customerId++;
    const customer: Customer = {
      id,
      userId: user.id,
      age: age ? age : null,
      gender: gender as any,
      address: null,
      phone: null
    };
    
    this.customers.set(id, customer);
    
    return {
      ...user,
      role: "customer",
      customerDetails: customer
    };
  }

  async createOwner(data: { email: string; password: string; name: string; role: string; phone?: string; restaurantName: string; location: string }): Promise<UserWithRole> {
    const { email, password, name, role, phone, restaurantName, location } = data;
    
    // Create user
    const user = await this.createUser({
      email,
      password,
      name,
      role: role as "customer" | "owner" | "admin" | "partner"
    });
    
    // Create owner
    const id = this.ownerId++;
    const owner: Owner = {
      id,
      userId: user.id,
      phone: phone || null
    };
    
    this.owners.set(id, owner);
    
    // Create restaurant
    const restaurant = await this.createRestaurant({
      ownerId: owner.id,
      name: restaurantName,
      location,
      category: []
    });
    
    return {
      ...user,
      role: "owner",
      ownerDetails: owner,
      restaurant
    };
  }

  async createPartner(data: { email: string; password: string; name: string; role: string; phone: string; vehicleName: string; vehicleColor: string; vehicleNumber: string; licenseNumber: string }): Promise<UserWithRole> {
    const { email, password, name, role, phone, vehicleName, vehicleColor, vehicleNumber, licenseNumber } = data;
    
    // Create user
    const user = await this.createUser({
      email,
      password,
      name,
      role: role as "customer" | "owner" | "admin" | "partner"
    });
    
    // Create partner
    const id = this.partnerId++;
    const partner: Partner = {
      id,
      userId: user.id,
      phone,
      vehicleName,
      vehicleColor,
      vehicleNumber,
      licenseNumber,
      licensePhoto: null,
      billbookPhoto: null,
      status: "available"
    };
    
    this.partners.set(id, partner);
    
    return {
      ...user,
      role: "partner",
      partnerDetails: partner
    };
  }

  // Helper methods to get role-specific details by user ID
  private async getCustomerByUserId(userId: number): Promise<Customer | undefined> {
    for (const customer of this.customers.values()) {
      if (customer.userId === userId) {
        return customer;
      }
    }
    return undefined;
  }

  private async getOwnerByUserId(userId: number): Promise<Owner | undefined> {
    for (const owner of this.owners.values()) {
      if (owner.userId === userId) {
        return owner;
      }
    }
    return undefined;
  }

  private async getPartnerByUserId(userId: number): Promise<Partner | undefined> {
    for (const partner of this.partners.values()) {
      if (partner.userId === userId) {
        return partner;
      }
    }
    return undefined;
  }

  // Restaurant management methods
  async getRestaurants(location?: string): Promise<Restaurant[]> {
    const restaurants = Array.from(this.restaurants.values())
      .filter(restaurant => restaurant.status === "open");
    
    if (!location) {
      return restaurants;
    }
    
    return restaurants.filter(restaurant => 
      restaurant.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurantByOwnerId(ownerId: number): Promise<Restaurant | undefined> {
    const owner = await this.getOwnerByUserId(ownerId);
    if (!owner) return undefined;
    
    for (const restaurant of this.restaurants.values()) {
      if (restaurant.ownerId === owner.id) {
        return restaurant;
      }
    }
    return undefined;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.restaurantId++;
    const newRestaurant: Restaurant = {
      ...restaurant,
      id,
      rating: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      blockReason: null,
      photo: restaurant.photo || null,
      category: restaurant.category || null
    };
    
    this.restaurants.set(id, newRestaurant);
    return newRestaurant;
  }

  async updateRestaurantStatus(id: number, status: string, reason?: string): Promise<Restaurant> {
    const restaurant = await this.getRestaurant(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    
    restaurant.status = status as any;
    restaurant.blockReason = reason || null;
    restaurant.updatedAt = new Date();
    
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async getRestaurantsByStatus(status?: string): Promise<Restaurant[]> {
    const restaurants = Array.from(this.restaurants.values());
    
    if (!status) {
      return restaurants;
    }
    
    return restaurants.filter(restaurant => restaurant.status === status);
  }

  // Food items management methods
  async getFoodItems(restaurantId: number): Promise<FoodItem[]> {
    const foodItems = Array.from(this.foodItems.values());
    return foodItems.filter(item => item.restaurantId === restaurantId);
  }

  async createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem> {
    const id = this.foodItemId++;
    const newFoodItem: FoodItem = {
      ...foodItem,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      photo: foodItem.photo || null,
      category: foodItem.category || null,
      description: foodItem.description || null
    };
    
    this.foodItems.set(id, newFoodItem);
    return newFoodItem;
  }

  // Order management methods
  async getCustomerOrders(customerId: number): Promise<Order[]> {
    const customer = await this.getCustomerByUserId(customerId);
    if (!customer) return [];
    
    const orders = Array.from(this.orders.values());
    return orders.filter(order => order.customerId === customer.id);
  }

  async getRestaurantOrders(ownerId: number): Promise<Order[]> {
    const restaurant = await this.getRestaurantByOwnerId(ownerId);
    if (!restaurant) return [];
    
    const orders = Array.from(this.orders.values());
    return orders.filter(order => order.restaurantId === restaurant.id);
  }

  async getPartnerOrders(partnerId: number): Promise<Order[]> {
    const partner = await this.getPartnerByUserId(partnerId);
    if (!partner) return [];
    
    const orders = Array.from(this.orders.values());
    return orders.filter(order => order.partnerId === partner.id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const newOrder: Order = {
      ...orderData,
      id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDeliveryTime: 30, // 30 minutes by default
      actualDeliveryTime: null,
      cancelReason: null,
      partnerId: orderData.partnerId || null
    };
    
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string, userId: number, role: string, reason?: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Validate permission based on role
    if (role === "owner") {
      const restaurant = await this.getRestaurantByOwnerId(userId);
      if (!restaurant || restaurant.id !== order.restaurantId) {
        throw new Error("You don't have permission to update this order");
      }
    } else if (role === "partner") {
      const partner = await this.getPartnerByUserId(userId);
      if (!partner || (order.partnerId !== null && order.partnerId !== partner.id)) {
        throw new Error("You don't have permission to update this order");
      }
      
      // Assign partner to order if not already assigned
      if (order.partnerId === null && ["picked", "delivered"].includes(status)) {
        order.partnerId = partner.id;
      }
    }
    
    order.status = status as any;
    order.updatedAt = new Date();
    
    if (status === "cancelled") {
      order.cancelReason = reason || "Cancelled by " + role;
    }
    
    if (status === "delivered") {
      order.actualDeliveryTime = Math.floor((new Date().getTime() - order.createdAt.getTime()) / 60000); // In minutes
    }
    
    this.orders.set(id, order);
    return order;
  }

  // Partner management methods
  async updatePartnerStatus(userId: number, status: string): Promise<Partner> {
    const partner = await this.getPartnerByUserId(userId);
    if (!partner) {
      throw new Error("Partner not found");
    }
    
    partner.status = status as any;
    
    this.partners.set(partner.id, partner);
    return partner;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store with PostgreSQL
    const PostgresSessionStore = connectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed admin users
    this.seedAdmins();
  }

  private async seedAdmins() {
    try {
      const admins = [
        { username: "Diwin Paudel", email: "diwin@foodexpress.com", password: "Diwin@022321" },
        { username: "Anupama Singh", email: "anupama@foodexpress.com", password: "Anupama@022310" },
        { username: "Shaivi Sharma", email: "shaivi@foodexpress.com", password: "Shaivi@022336" }
      ];
      
      for (const admin of admins) {
        // Check if admin already exists
        const existingUser = await this.getUserByEmail(admin.email);
        if (!existingUser) {
          // Create admin user in database
          await db.insert(users).values({
            email: admin.email,
            password: admin.password, // Store as plain text for seeded admins
            name: admin.username,
            role: "admin",
            status: "active"
          });
        }
      }
    } catch (error) {
      console.error("Error seeding admin users:", error);
    }
  }

  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserWithDetails(id: number): Promise<UserWithRole | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    switch (user.role) {
      case "customer": {
        const [customerDetails] = await db
          .select()
          .from(customers)
          .where(eq(customers.userId, id));
        
        if (!customerDetails) return undefined;
        
        return {
          ...user,
          role: "customer",
          customerDetails
        };
      }
      case "owner": {
        const [ownerDetails] = await db
          .select()
          .from(owners)
          .where(eq(owners.userId, id));
        
        if (!ownerDetails) return undefined;
        
        const [restaurant] = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.ownerId, ownerDetails.id));
        
        return {
          ...user,
          role: "owner",
          ownerDetails,
          restaurant
        };
      }
      case "partner": {
        const [partnerDetails] = await db
          .select()
          .from(partners)
          .where(eq(partners.userId, id));
        
        if (!partnerDetails) return undefined;
        
        return {
          ...user,
          role: "partner",
          partnerDetails
        };
      }
      case "admin":
        return {
          ...user,
          role: "admin"
        };
      default:
        return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    
    return newUser;
  }

  async updateUserStatus(id: number, status: string, reason?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        status: status as any,
        blockReason: reason,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async updateUserProfile(id: number, data: { name?: string; phone?: string; address?: string; age?: number; gender?: string; profilePicture?: string }): Promise<UserWithRole> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update role-specific tables if phone is updated
    if (data.phone) {
      if (user.role === "owner") {
        await db
          .update(owners)
          .set({ phone: data.phone })
          .where(eq(owners.userId, id));
      } else if (user.role === "partner") {
        await db
          .update(partners)
          .set({ phone: data.phone })
          .where(eq(partners.userId, id));
      }
    }
    
    return user as UserWithRole;
  }

  async getUsersByRole(role?: string): Promise<User[]> {
    if (role) {
      return db.select().from(users).where(eq(users.role, role as any));
    }
    
    return db.select().from(users);
  }

  // Role-specific user creation methods
  async createCustomer(data: { email: string; password: string; name: string; role: string; age?: number; gender?: string }): Promise<UserWithRole> {
    const { email, password, name, role, age, gender } = data;
    
    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password,
        name,
        role: role as "customer" | "owner" | "admin" | "partner",
        status: "active",
        blockReason: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Create customer
    const [customer] = await db
      .insert(customers)
      .values({
        userId: user.id,
        age: age || null,
        gender: gender as any || null,
        address: null,
        phone: null
      })
      .returning();
    
    return {
      ...user,
      role: "customer",
      customerDetails: customer
    };
  }

  async createOwner(data: { email: string; password: string; name: string; role: string; phone?: string; restaurantName: string; location: string; status?: string }): Promise<UserWithRole> {
    const { email, password, name, role, phone, restaurantName, location, status } = data;
    
    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password,
        name,
        role: role as "customer" | "owner" | "admin" | "partner",
        status: (status || "active") as "active" | "blocked" | "pending",
        blockReason: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Create owner
    const [owner] = await db
      .insert(owners)
      .values({
        userId: user.id,
        phone: phone || null
      })
      .returning();
    
    // Create restaurant
    const [restaurant] = await db
      .insert(restaurants)
      .values({
        ownerId: owner.id,
        name: restaurantName,
        location,
        category: [],
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return {
      ...user,
      role: "owner",
      ownerDetails: owner,
      restaurant
    };
  }

  async createPartner(data: { email: string; password: string; name: string; role: string; phone: string; vehicleName: string; vehicleColor: string; vehicleNumber: string; licenseNumber: string }): Promise<UserWithRole> {
    const { email, password, name, role, phone, vehicleName, vehicleColor, vehicleNumber, licenseNumber } = data;
    
    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password,
        name,
        role: role as "customer" | "owner" | "admin" | "partner",
        status: "active",
        blockReason: null,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Create partner
    const [partner] = await db
      .insert(partners)
      .values({
        userId: user.id,
        phone,
        vehicleName,
        vehicleColor,
        vehicleNumber,
        licenseNumber,
        licensePhoto: null,
        billbookPhoto: null,
        status: "available"
      })
      .returning();
    
    return {
      ...user,
      role: "partner",
      partnerDetails: partner
    };
  }

  // Restaurant management methods
  async getRestaurants(location?: string): Promise<Restaurant[]> {
    if (location) {
      return db
        .select()
        .from(restaurants)
        .where(and(eq(restaurants.status, "open"), eq(restaurants.location, location)));
    }
    
    return db
      .select()
      .from(restaurants)
      .where(eq(restaurants.status, "open"));
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));
    
    return restaurant;
  }

  async getRestaurantByOwnerId(ownerId: number): Promise<Restaurant | undefined> {
    // First, get the owner by user ID
    const [owner] = await db
      .select()
      .from(owners)
      .where(eq(owners.userId, ownerId));
    
    if (!owner) return undefined;
    
    // Then, get the restaurant by owner ID
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, owner.id));
    
    return restaurant;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values({
        ...restaurant,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newRestaurant;
  }

  async updateRestaurantStatus(id: number, status: string, reason?: string): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({
        status: status as any,
        blockReason: reason || null,
        updatedAt: new Date()
      })
      .where(eq(restaurants.id, id))
      .returning();
    
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    
    return restaurant;
  }

  async getRestaurantsByStatus(status?: string): Promise<Restaurant[]> {
    if (status) {
      return db
        .select()
        .from(restaurants)
        .where(eq(restaurants.status, status as any));
    }
    
    return db.select().from(restaurants);
  }

  async updateRestaurant(id: number, data: { name?: string; location?: string; photo?: string; category?: string[] }): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(restaurants.id, id))
      .returning();
    
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    
    return restaurant;
  }

  // Food items management methods
  async getFoodItems(restaurantId: number): Promise<FoodItem[]> {
    return db
      .select()
      .from(foodItems)
      .where(eq(foodItems.restaurantId, restaurantId));
  }

  async createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem> {
    const [newFoodItem] = await db
      .insert(foodItems)
      .values({
        ...foodItem,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newFoodItem;
  }

  async updateFoodItem(id: number, data: { name?: string; description?: string; price?: number; photo?: string; category?: string[] }): Promise<FoodItem> {
    const [foodItem] = await db
      .update(foodItems)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(foodItems.id, id))
      .returning();
    
    if (!foodItem) {
      throw new Error("Food item not found");
    }
    
    return foodItem;
  }

  async deleteFoodItem(id: number): Promise<void> {
    await db.delete(foodItems).where(eq(foodItems.id, id));
  }

  // Order management methods
  async getCustomerOrders(customerId: number): Promise<Order[]> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, customerId));
    
    if (!customer) return [];
    
    return db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customer.id))
      .orderBy(desc(orders.createdAt));
  }

  async getRestaurantOrders(ownerId: number): Promise<Order[]> {
    // First, get the owner's restaurant
    const restaurant = await this.getRestaurantByOwnerId(ownerId);
    if (!restaurant) return [];
    
    return db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurant.id))
      .orderBy(desc(orders.createdAt));
  }

  async getPartnerOrders(partnerId: number): Promise<Order[]> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, partnerId));
    
    if (!partner) return [];
    
    return db
      .select()
      .from(orders)
      .where(eq(orders.partnerId, partner.id))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...orderData,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedDeliveryTime: 30
      })
      .returning();
    
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string, userId: number, role: string, reason?: string): Promise<Order> {
    // Fetch the current order first
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Validate permission based on role
    if (role === "owner") {
      const restaurant = await this.getRestaurantByOwnerId(userId);
      if (!restaurant || restaurant.id !== order.restaurantId) {
        throw new Error("You don't have permission to update this order");
      }
    } else if (role === "partner") {
      const [partner] = await db
        .select()
        .from(partners)
        .where(eq(partners.userId, userId));
      
      if (!partner || (order.partnerId !== null && order.partnerId !== partner.id)) {
        throw new Error("You don't have permission to update this order");
      }
      
      // Assign partner to order if not already assigned
      if (order.partnerId === null && ["picked", "delivered"].includes(status)) {
        order.partnerId = partner.id;
      }
    }
    
    // Prepare update data
    const updateData: any = {
      status: status as any,
      updatedAt: new Date()
    };
    
    if (status === "cancelled") {
      updateData.cancelReason = reason || `Cancelled by ${role}`;
    }
    
    if (status === "delivered") {
      updateData.actualDeliveryTime = Math.floor((new Date().getTime() - order.createdAt.getTime()) / 60000);
    }
    
    // Special handling for partner assignment
    if (role === "partner" && order.partnerId === null && ["picked", "delivered"].includes(status)) {
      const [partner] = await db
        .select()
        .from(partners)
        .where(eq(partners.userId, userId));
      
      if (partner) {
        updateData.partnerId = partner.id;
      }
    }
    
    // Update the order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }

  // Partner management methods
  async updatePartnerStatus(userId: number, status: string): Promise<Partner> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, userId));
    
    if (!partner) {
      throw new Error("Partner not found");
    }
    
    const [updatedPartner] = await db
      .update(partners)
      .set({
        status: status as any
      })
      .where(eq(partners.id, partner.id))
      .returning();
    
    return updatedPartner;
  }

  async updateUserProfile(id: number, data: { name?: string; phone?: string; address?: string; age?: number; gender?: string; profilePicture?: string }): Promise<UserWithRole> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user table
    const userUpdates: any = {};
    if (data.name) userUpdates.name = data.name;
    if (data.profilePicture !== undefined) userUpdates.profilePicture = data.profilePicture;
    userUpdates.updatedAt = new Date();

    if (Object.keys(userUpdates).length > 0) {
      await db
        .update(users)
        .set(userUpdates)
        .where(eq(users.id, id));
    }

    // Update role-specific table
    if (user.role === "customer") {
      const customerUpdates: any = {};
      if (data.phone !== undefined) customerUpdates.phone = data.phone;
      if (data.address !== undefined) customerUpdates.address = data.address;
      if (data.age !== undefined) customerUpdates.age = data.age;
      if (data.gender !== undefined) customerUpdates.gender = data.gender;

      if (Object.keys(customerUpdates).length > 0) {
        await db
          .update(customers)
          .set(customerUpdates)
          .where(eq(customers.userId, id));
      }
    } else if (user.role === "owner") {
      if (data.phone !== undefined) {
        await db
          .update(owners)
          .set({ phone: data.phone })
          .where(eq(owners.userId, id));
      }
    } else if (user.role === "partner") {
      if (data.phone !== undefined) {
        await db
          .update(partners)
          .set({ phone: data.phone })
          .where(eq(partners.userId, id));
      }
    }

    const updatedUser = await this.getUserWithDetails(id);
    if (!updatedUser) {
      throw new Error("Failed to fetch updated user");
    }
    
    return updatedUser;
  }

  async updateRestaurant(id: number, data: { name?: string; location?: string; photo?: string; category?: string[] }): Promise<Restaurant> {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.location) updates.location = data.location;
    if (data.photo !== undefined) updates.photo = data.photo;
    if (data.category) updates.category = data.category;
    updates.updatedAt = new Date();

    const [restaurant] = await db
      .update(restaurants)
      .set(updates)
      .where(eq(restaurants.id, id))
      .returning();
    
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    
    return restaurant;
  }

  async updateFoodItem(id: number, data: { name?: string; description?: string; price?: number; photo?: string; category?: string[] }): Promise<FoodItem> {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price) updates.price = data.price;
    if (data.photo !== undefined) updates.photo = data.photo;
    if (data.category) updates.category = data.category;
    updates.updatedAt = new Date();

    const [foodItem] = await db
      .update(foodItems)
      .set(updates)
      .where(eq(foodItems.id, id))
      .returning();
    
    if (!foodItem) {
      throw new Error("Food item not found");
    }
    
    return foodItem;
  }

  async deleteFoodItem(id: number): Promise<void> {
    const result = await db
      .delete(foodItems)
      .where(eq(foodItems.id, id));
    
    if (result.rowCount === 0) {
      throw new Error("Food item not found");
    }
  }
  async getFoodItems(restaurantId: number): Promise<FoodItem[]> {
    return await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.restaurantId, restaurantId));
  }

  async createFoodItem(insertFoodItem: InsertFoodItem): Promise<FoodItem> {
    const [foodItem] = await db
      .insert(foodItems)
      .values(insertFoodItem)
      .returning();
    return foodItem;
  }

  async updateFoodItem(id: number, updateData: Partial<InsertFoodItem>): Promise<FoodItem> {
    const [foodItem] = await db
      .update(foodItems)
      .set(updateData)
      .where(eq(foodItems.id, id))
      .returning();
    return foodItem;
  }

  async deleteFoodItem(id: number): Promise<void> {
    await db
      .delete(foodItems)
      .where(eq(foodItems.id, id));
  }

  async updateRestaurant(id: number, updateData: Partial<InsertRestaurant>): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set(updateData)
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants);
  }

  async getRestaurantById(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));
    return restaurant || undefined;
  }
}

// Use database storage with admin seeding
export const storage = new DatabaseStorage();
