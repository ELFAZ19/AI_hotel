const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Adane Hotel API",
      version: "1.0.0",
      description: "API documentation for Adane Hotel management system",
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
        Role: {
          type: "string",
          enum: ["guest", "receptionist", "manager", "admin"],
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string", nullable: true },
            role: { $ref: "#/components/schemas/Role" },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RoomType: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            base_price: { type: "number" },
            max_guests: { type: "integer" },
            amenities: {
              type: "array",
              items: { type: "string" },
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Room: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            room_number: { type: "string" },
            room_type_id: { type: "integer" },
            floor: { type: "integer" },
            status: {
              type: "string",
              enum: ["available", "occupied", "maintenance", "inactive"],
            },
            price_override: { type: "number", nullable: true },
            description: { type: "string", nullable: true },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
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
            status: {
              type: "string",
              enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
            },
            special_requests: { type: "string", nullable: true },
            confirmed_at: { type: "string", format: "date-time", nullable: true },
            checked_in_at: { type: "string", format: "date-time", nullable: true },
            checked_out_at: { type: "string", format: "date-time", nullable: true },
            cancelled_at: { type: "string", format: "date-time", nullable: true },
            cancellation_note: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            reservation_id: { type: "string", format: "uuid" },
            chapa_tx_ref: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "success", "failed", "refunded"],
            },
            chapa_checkout_url: { type: "string", nullable: true },
            payment_method: { type: "string", nullable: true },
            paid_at: { type: "string", format: "date-time", nullable: true },
            raw_response: { type: "object" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        RestaurantReservation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            guest_id: { type: "string", format: "uuid" },
            reservation_date: { type: "string", format: "date" },
            reservation_time: { type: "string", format: "time" },
            party_size: { type: "integer" },
            special_requests: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "seated", "completed", "cancelled"],
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        EventSpace: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            capacity: { type: "integer" },
            price_per_hour: { type: "number" },
            amenities: {
              type: "array",
              items: { type: "string" },
            },
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
            event_type: { type: "string", nullable: true },
            event_date: { type: "string", format: "date" },
            start_time: { type: "string", format: "time" },
            end_time: { type: "string", format: "time" },
            guest_count: { type: "integer" },
            total_price: { type: "number", nullable: true },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "completed", "cancelled"],
            },
            notes: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            guest_id: { type: "string", format: "uuid" },
            reservation_id: { type: "string", format: "uuid", nullable: true },
            room_id: { type: "string", format: "uuid", nullable: true },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string", nullable: true },
            is_published: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: {
              type: "array",
              items: { type: "object" },
              nullable: true,
            },
          },
        },
        PaginationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { type: "object" },
            },
            meta: {
              type: "object",
              properties: {
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
