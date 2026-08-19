# PrimeDeal — Quick-Commerce Web Application

**PrimeDeal** is a full-stack quick-commerce web application designed for fast local shopping and daily essentials delivery. Built with **React 19**, **TypeScript**, **Vite**, **Node.js**, **Express**, **Prisma ORM**, and **SQLite**.

---

## 🏗️ Architecture Overview

```
 ┌──────────────────────────────────────────────────────────┐
 │                     React 19 Client                      │
 │ (Landing, Hero, Nearby, Search, Shop Details, Cart,      │
 │  Checkout, Orders, Profile, Admin Store & Inventory)     │
 └────────────────────────────┬─────────────────────────────┘
                              │ Axios HTTP / REST APIs
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │                    Express Backend                       │
 │  - auth (JWT Cookie / Authorization Header)              │
 │  - routers: /user, /shop, /product, /address, /order     │
 │  - upload: Multer + Cloudinary                           │
 └────────────────────────────┬─────────────────────────────┘
                              │ Prisma ORM
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │                   SQLite Database                        │
 │  - User, Address, Shop, Category, Product,               │
 │    ShopInventory, Order, OrderItem, Delivery, Payment    │
 └────────────────────────────?─────────────────────────────┘
```

### Key Tech Stack Components
- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS, Radix UI, Lucide Icons, Framer Motion, Zustand state management, Sonner notifications.
- **Backend**: Node.js, Express.js, TypeScript (`ts-node`, `nodemon`).
- **Database & ORM**: Prisma ORM (v6) with SQLite (`dev.db`).
- **Authentication**: JWT token in HTTP-Only cookie (`token`) or Bearer Authorization header. `bcryptjs` password hashing.
- **File Storage**: Cloudinary SDK + Multer memory storage.

---

## ⚡ Installation & Setup Instructions

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### 1. Clone the repository
```bash
git clone https://github.com/jit1006/PrimeDeal.git
cd PrimeDeal
```

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="your_secret_jwt_key_here"
CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

### 3. Install Dependencies
Install dependencies for both root (backend) and client (frontend):
```bash
npm install
npm install --prefix client
```

### 4. Database Setup & Prisma Migration
Push the Prisma schema to set up SQLite database:
```bash
npx prisma db push
```

### 5. Run in Development Mode
Start both frontend and backend concurrently or separately:

**Backend Server (Runs on http://localhost:3000):**
```bash
npm run dev
```

**Frontend Client (Runs on http://localhost:5173):**
```bash
cd client
npm run dev
```

### 6. Build for Production
To build the production client and test full-stack static serving:
```bash
npm run build
npm start
```

---

## 📁 Repository Folder Structure

```
PrimeDeal/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── admin/              # Admin store & inventory management
│   │   ├── auth/               # Signup, Login, Password Reset, Verification
│   │   ├── components/         # Core UI components (Navbar, Cart, Search, Nearby, etc.)
│   │   ├── config/             # Axios API client & environment variables
│   │   ├── lib/                # Utility helpers (cn, tailwind merge)
│   │   ├── schema/             # Zod validation schemas
│   │   ├── types/              # TypeScript interface definitions
│   │   └── zustand/            # State management stores
│   ├── package.json
│   └── vite.config.ts
├── prisma/                     # Database Schema & SQLite file
│   └── schema.prisma
├── server/                     # Backend Express REST API
│   ├── config/                 # JWT secret & server configurations
│   ├── controller/             # User, Shop, Product, Address, Order controllers
│   ├── db/                     # Prisma client singleton
│   ├── middlewares/            # Auth & Multer upload middlewares
│   ├── routes/                 # Express API routes
│   └── index.ts                # Server entry point
├── .env.example                # Sample environment variables file
├── package.json                # Root package configuration
└── Readme.md                   # Project Documentation
```

---

## 📡 API Endpoints Reference

### User Authentication (`/api/v1/user`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user account |
| POST | `/login` | Authenticate user & issue JWT token |
| POST | `/logout` | Clear auth cookie |
| GET | `/checkauth` | Fetch authenticated user session |
| PUT | `/profile/update` | Update user profile details |

### Address Management (`/api/v1/address`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Add a new address |
| GET | `/` | List all addresses for user |
| PUT | `/:id` | Update address details |
| DELETE | `/:id` | Delete address |
| PATCH | `/:id/default` | Set address as default shipping location |

### Shop Management (`/api/v1/shop`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a new shop (Admin/Seller) |
| GET | `/` | Get all shops owned by user |
| PUT | `/` | Update shop details & banner |
| GET | `/nearby` | Get shops within radius (Haversine formula) |
| GET | `/order` | Get all orders placed at user's shops |
| PUT | `/order/:orderId/status` | Update shop order status |
| GET | `/:id` | Get details for a single shop |

### Product Catalog & Inventory (`/api/v1/product`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a global catalog product |
| PUT | `/:id` | Edit product details |
| GET | `/shop/:shopId` | Fetch all products in a shop inventory |
| GET | `/catalog` | Global product search & category filtering |
| GET | `/search` | Nearby product search with best price filter |
| POST | `/add-to-shop` | Add catalog product to shop inventory |

### Order Flow (`/api/v1/order`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create order from cart items |
| GET | `/` | Fetch all orders for logged-in user |
| GET | `/:orderId` | Get order details by ID |
| PUT | `/:orderId/status` | Update order status |

---

## 🛠️ Troubleshooting Guide

1. **`Prisma Client not initialized` error**:
   Run `npx prisma db push` or `npx prisma generate` to rebuild `@prisma/client`.

2. **CORS errors in browser**:
   Ensure `server/index.ts` has `http://localhost:5173` listed under `corsOptions.origin`.

3. **TypeScript casing errors during client build**:
   Ensure file imports in `src/zustand` match exact file casing (`useCartStore.ts` and `useOrderStore.ts`).

---

## 📜 License
ISC License
