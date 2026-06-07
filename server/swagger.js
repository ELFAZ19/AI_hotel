const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Adane Hotel API",
      version: "1.0.0",
      description: "Complete API for the Adane Hotel Management System — rooms, reservations, payments, restaurant, events, and admin dashboard.",
    },
    servers: [
      {
        url: process.env.SERVER_URL || "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
            role: { type: "string", enum: ["guest", "receptionist", "manager", "admin"] },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RoomType: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            description: { type: "string" },
            base_price: { type: "number" },
            max_guests: { type: "integer" },
            amenities: { type: "array", items: { type: "string" } },
          },
        },
        Room: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            room_number: { type: "string" },
            room_type_id: { type: "integer" },
            floor: { type: "integer" },
            status: { type: "string", enum: ["available", "occupied", "maintenance", "inactive"] },
            price_override: { type: "number", nullable: true },
            effective_price: { type: "number" },
            description: { type: "string" },
            is_active: { type: "boolean" },
            room_type_name: { type: "string" },
            primary_image_url: { type: "string", nullable: true },
          },
        },
        Reservation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            guest_id: { type: "string", format: "uuid" },
            room_id: { type: "string", format: "uuid" },
            check_in: { type: "string", format: "date" },
            check_out: { type: "string", format: "date" },
            adults: { type: "integer" },
            children: { type: "integer" },
            total_price: { type: "number" },
            status: { type: "string", enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"] },
            special_requests: { type: "string" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            reservation_id: { type: "string", format: "uuid" },
            amount: { type: "number" },
            tx_ref: { type: "string" },
            status: { type: "string", enum: ["pending", "success", "failed"] },
            paid_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        RestaurantReservation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            guest_id: { type: "string", format: "uuid" },
            date: { type: "string", format: "date" },
            time: { type: "string", example: "19:30" },
            party_size: { type: "integer" },
            status: { type: "string", enum: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"] },
            special_requests: { type: "string" },
          },
        },
        EventSpace: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            capacity: { type: "integer" },
            price_per_hour: { type: "number" },
            amenities: { type: "array", items: { type: "string" } },
            is_active: { type: "boolean" },
          },
        },
        EventBooking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            guest_id: { type: "string", format: "uuid" },
            space_id: { type: "integer" },
            event_name: { type: "string" },
            event_type: { type: "string" },
            event_date: { type: "string", format: "date" },
            start_time: { type: "string", example: "14:00" },
            end_time: { type: "string", example: "18:00" },
            guest_count: { type: "integer" },
            total_price: { type: "number" },
            status: { type: "string", enum: ["pending", "confirmed", "completed", "cancelled"] },
          },
        },
        DashboardStats: {
          type: "object",
          properties: {
            overview: {
              type: "object",
              properties: {
                totalRooms: { type: "integer" },
                availableRooms: { type: "integer" },
                occupiedRooms: { type: "integer" },
                totalGuests: { type: "integer" },
                totalReservations: { type: "integer" },
              },
            },
            revenue: {
              type: "object",
              properties: {
                today: { type: "number" },
                thisMonth: { type: "number" },
                thisYear: { type: "number" },
              },
            },
            occupancyRate: { type: "number" },
            recentReservations: { type: "array", items: { type: "object" } },
            revenueByMonth: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
