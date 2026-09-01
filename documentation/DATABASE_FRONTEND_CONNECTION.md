# E-Commerce Database and Frontend Connection Architecture
## School Report Documentation

---

## 1. System Overview

This e-commerce application follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND TIER                                │
│           Angular 21.2 (TypeScript/SCSS)                        │
│           Running on http://localhost:4200                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST Requests (JSON)
                         │ CORS Enabled
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                              │
│           Node.js/Express.js Backend                            │
│           Running on http://localhost:3000                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           API Routes & Controllers                       │   │
│  │  - /api/auth       - /api/cart     - /api/orders        │   │
│  │  - /api/products   - /api/user     - /api/payment       │   │
│  │  - /api/categories - /api/reviews  - /api/notifications │   │
│  └─────────────┬───────────────────────────────────────────┘   │
│                │                                                  │
│  ┌─────────────┴───────────────────────────────────────────┐   │
│  │     Service Layer (Business Logic)                       │   │
│  │  - Auth Service    - Cart Service   - Order Service     │   │
│  │  - Product Service - User Service   - Payment Service   │   │
│  └─────────────┬───────────────────────────────────────────┘   │
│                │                                                  │
│  ┌─────────────┴───────────────────────────────────────────┐   │
│  │     Repository Layer (Data Access)                       │   │
│  │  - Direct database queries                               │   │
│  │  - Transaction handling                                  │   │
│  └─────────────┬───────────────────────────────────────────┘   │
└────────────────┼──────────────────────────────────────────────────┘
                 │
                 │ MySQL Queries (SQL)
                 │ Connection Pool (max 20 connections)
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE TIER                                 │
│           MySQL Database                                        │
│                                                                   │
│  - users          - orders         - notifications              │
│  - products       - payments        - order_reviews             │
│  - categories     - cart_items      - addresses                 │
│  - refresh_tokens - support_tickets                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Connection (Backend ↔ MySQL)

### 2.1 Connection Pool Configuration

**File:** [backend/src/core/config/pool.js](backend/src/core/config/pool.js)

The backend uses **mysql2/promise** library with a connection pool:

```javascript
import mysql from 'mysql2/promise';

export function initPool(config) {
  pool = mysql.createPool({
    ...config,
    waitForConnections: true,    // Queue requests if no connections available
    connectionLimit: 20,          // Max 20 simultaneous connections
    queueLimit: 0,                // Unlimited queue
  });
}
```

**Key Benefits:**
- **Reusable Connections:** Multiple requests share connections instead of creating new ones
- **Performance:** Reduces connection overhead by ~90%
- **Stability:** Queue system prevents database overload
- **Scalability:** Handles 20+ concurrent users efficiently

### 2.2 Database Schema

The MySQL database contains 8 main tables:

| Table | Purpose | Example Fields |
|-------|---------|-----------------|
| `users` | User accounts & credentials | id, email, password_hash, role |
| `products` | Product catalog | id, name, price, stock, category_id |
| `categories` | Product categories | id, name, slug |
| `cart_items` | Shopping cart items | id, user_id, product_id, quantity |
| `orders` | Customer orders | id, user_id, total, status, created_at |
| `refresh_tokens` | Auth tokens (secure) | id, user_id, token_hash, expires_at |
| `addresses` | Shipping addresses | id, user_id, city, postal_code |
| `notifications` | User alerts | id, user_id, message, type |

**Schema Relationships:**
```
users (1) ──→ (∞) orders
users (1) ──→ (∞) cart_items
users (1) ──→ (∞) addresses
users (1) ──→ (∞) refresh_tokens
categories (1) ──→ (∞) products
products (1) ──→ (∞) cart_items
products (1) ──→ (∞) orders
```

### 2.3 Query Execution Flow

**Example: User Login Process**

```
1. Repository Layer (auth.repository.js)
   ├─ Receives: email
   └─ Executes: SELECT * FROM users WHERE email = ?
                ↓
2. Connection Pool
   ├─ Retrieves available MySQL connection
   ├─ Sends query to database
   └─ Waits for result
                ↓
3. MySQL Database
   ├─ Finds user record
   ├─ Returns row data (with password_hash)
   └─ Connection returns to pool
                ↓
4. Service Layer (auth.service.js)
   ├─ Verifies password hash
   ├─ Generates JWT tokens
   └─ Returns access_token and refresh_token
```

---

## 3. Backend API Layer (Node.js/Express)

### 3.1 Server Architecture

**File:** [backend/src/app.js](backend/src/app.js)

```javascript
// CORS Configuration - Allow frontend to make requests
app.use(cors({
  origin: "http://localhost:4200",  // Frontend URL
  credentials: true                  // Allow cookies
}));

// API Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
// ... more routes
```

### 3.2 Request Processing Pipeline

```
HTTP Request (from Frontend)
    ↓
CORS Middleware → Validates origin (must be localhost:4200)
    ↓
Express Router → Routes to correct endpoint (/api/auth, /api/products, etc.)
    ↓
Validation Middleware → Validates request body/parameters
    ↓
Authentication Middleware → Checks JWT token (if required)
    ↓
Controller → Calls service layer
    ↓
Service Layer → Applies business logic
    ↓
Repository Layer → Executes database query
    ↓
Response → Sends JSON back to frontend
```

### 3.3 API Routes

**Base URL:** `http://localhost:3000/api`

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|-----------------|
| `/auth/register` | POST | Create new account | ✗ |
| `/auth/login` | POST | Authenticate user | ✗ |
| `/auth/me` | GET | Get current user | ✓ |
| `/auth/logout` | POST | Logout user | ✓ |
| `/products` | GET | List all products | ✗ |
| `/cart` | GET/POST | Manage shopping cart | ✓ |
| `/orders` | GET/POST | Create & view orders | ✓ |
| `/user` | GET/PUT | Get/update user profile | ✓ |
| `/payment` | POST | Process payment | ✓ |

---

## 4. Frontend Connection (Angular ↔ Backend)

### 4.1 Frontend Environment Configuration

**File:** [frontend/src/environments/environment.ts](frontend/src/environments/environment.ts)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',  // Backend server URL
  imagePath: 'assets/images/'
};
```

**Production Configuration:** 
- `environment.prod.ts` would point to live server URL (e.g., `https://api.example.com`)

### 4.2 Angular HTTP Communication

The Angular frontend communicates with the backend using **HttpClientModule**:

```
Angular Component
    ↓
Angular Service (HttpClient)
    ↓
HTTP GET/POST/PUT/DELETE Request
    ↓
Backend Express API
    ↓
Response (JSON)
    ↓
Angular Component Updates UI
```

**Example Flow - Fetching Products:**

```typescript
// Frontend (Angular Service)
getProducts() {
  return this.http.get(`${environment.apiBaseUrl}/products`);
}

// HTTP Request Sent
GET http://localhost:3000/api/products

// Backend Response (JSON)
{
  "success": true,
  "data": [
    { "id": 1, "name": "Laptop", "price": 999.99, "stock": 10 },
    { "id": 2, "name": "Mouse", "price": 19.99, "stock": 50 }
  ]
}

// Angular Component Receives Data
this.productService.getProducts().subscribe(response => {
  this.products = response.data;  // Display products on page
});
```

### 4.3 Authentication Flow

```
┌─ Frontend (Angular) ────────────────────────────────────────────┐
│                                                                   │
│  1. User enters email & password                                │
│  2. Angular sends POST to /api/auth/login                       │
│     └─ Body: { "email": "user@example.com", "password": "..." }│
│                                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─ Backend (Express) ──────────────────────────────────────────────┐
│                                                                   │
│  1. Receives login request                                      │
│  2. Queries database: SELECT * FROM users WHERE email = ?       │
│  3. Verifies password hash                                      │
│  4. Generates two tokens:                                       │
│     ├─ access_token (expires in 15 min) - for API requests     │
│     └─ refresh_token (expires in 7 days) - stored in cookie    │
│  5. Returns tokens to frontend                                  │
│                                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─ Frontend (Angular) ────────────────────────────────────────────┐
│                                                                   │
│  1. Receives tokens                                             │
│  2. Stores access_token in memory                               │
│  3. Stores refresh_token as HTTP-only cookie                   │
│  4. Redirects user to dashboard                                 │
│                                                                   │
│  Subsequent API Requests:                                       │
│  - Adds "Authorization: Bearer <access_token>" header           │
│  - Includes refresh_token cookie automatically                  │
│                                                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow Example: Adding Item to Cart

This example shows complete connection flow from frontend to database:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Frontend Action                                         │
│ User clicks "Add to Cart" button in Angular component           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Angular Makes HTTP Request                              │
│ POST http://localhost:3000/api/cart                             │
│ Headers: {                                                      │
│   "Authorization": "Bearer <access_token>",                     │
│   "Content-Type": "application/json"                            │
│ }                                                               │
│ Body: {                                                         │
│   "product_id": 5,                                              │
│   "quantity": 2                                                 │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Express Backend Receives Request                        │
│ - CORS middleware validates origin (localhost:4200) ✓           │
│ - Auth middleware verifies JWT token                            │
│ - Extracts user ID from token: user.id = 42                     │
│ - Passes to cart.controller.js                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Business Logic (cart.service.js)                        │
│ - Validates product exists                                      │
│ - Checks stock availability                                     │
│ - Checks if item already in cart                                │
│ - Calls repository layer                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Database Query (cart.repository.js)                     │
│ Gets connection from pool → Executes SQL:                       │
│                                                                  │
│ IF item exists:                                                 │
│   UPDATE cart_items SET quantity = quantity + 2                │
│   WHERE user_id = 42 AND product_id = 5                        │
│                                                                  │
│ ELSE:                                                           │
│   INSERT INTO cart_items                                        │
│   (user_id, product_id, quantity) VALUES (42, 5, 2)            │
│                                                                  │
│ Connection returned to pool for reuse                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Backend Returns Response                                │
│ HTTP 200 OK                                                     │
│ Body: {                                                         │
│   "success": true,                                              │
│   "message": "Item added to cart",                              │
│   "data": {                                                     │
│     "cart_item_id": 127,                                        │
│     "quantity": 2                                               │
│   }                                                             │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Angular Updates UI                                      │
│ Component receives response                                     │
│ - Updates cart count badge                                      │
│ - Shows success toast notification                              │
│ - Refreshes cart summary                                        │
│ - User sees "Item added to cart" message                        │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | JavaScript runtime | Latest |
| **Express.js** | Web framework | 4.19.2 |
| **mysql2/promise** | Database driver | 3.22.1 |
| **JWT** | Authentication tokens | 9.0.3 |
| **CORS** | Cross-origin requests | 2.8.6 |
| **bcrypt** | Password hashing | ✓ |

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Angular** | Frontend framework | 21.2.0 |
| **TypeScript** | Language | Latest |
| **RxJS** | Reactive programming | 7.8.0 |
| **Tailwind CSS** | Styling | Latest |
| **HttpClientModule** | HTTP requests | Built-in |

### Database

| Technology | Purpose |
|------------|---------|
| **MySQL** | Relational database |
| **Connection Pool** | Connection management |

---

## 7. Security Features

### 7.1 Frontend → Backend

- **CORS Protection:** Only `http://localhost:4200` allowed
- **HTTPS Ready:** Environment config supports production HTTPS
- **JWT Authentication:** Token-based auth with expiration

### 7.2 Backend → Database

- **Prepared Statements:** SQL injection prevention
- **Password Hashing:** Bcrypt with salt rounds
- **Token Hashing:** Refresh tokens stored as hashes (not plain text)
- **Connection Pool:** Prevents resource exhaustion

### 7.3 Data Privacy

- **HTTP-only Cookies:** Refresh token inaccessible to JavaScript
- **SameSite Policy:** CSRF attack prevention
- **Secure Flag:** Cookies only sent over HTTPS in production

---

## 8. Request Response Cycle Summary

```
Frontend (Angular)
    ↓ (HTTP Request with auth header)
Express CORS Middleware (validates origin)
    ↓
Express Router (route to /api/auth, /api/products, etc.)
    ↓
Auth Middleware (if required - verify JWT token)
    ↓
Request Validator (check body/params format)
    ↓
Controller (parse request, call service)
    ↓
Service Layer (business logic)
    ↓
Repository Layer (SQL queries)
    ↓
MySQL Database (execute query)
    ↓
Repository (return data)
    ↓
Service (format data)
    ↓
Controller (create response)
    ↓
Express (send JSON response)
    ↓ (HTTP Response)
Angular Service (receive JSON)
    ↓
Angular Component (update UI)
    ↓
User sees result in browser
```

---

## 9. Deployment Considerations

### Development
- Frontend: `http://localhost:4200` (Angular dev server)
- Backend: `http://localhost:3000` (Express dev server)
- Database: Local MySQL server

### Production
- Frontend: Built to `dist/` folder, served by web server
- Backend: Deployed to cloud server (AWS, Heroku, etc.)
- Database: Remote MySQL database (AWS RDS, etc.)
- Changes needed:
  - `environment.prod.ts` → points to production API URL
  - CORS origin → production domain
  - Database credentials → production credentials

---

## 10. Performance Optimization

| Optimization | Implementation |
|--------------|-----------------|
| **Connection Pooling** | Reuse 20 connections instead of creating new ones |
| **Query Optimization** | Indexed queries on frequently searched columns |
| **Caching** | Frontend caches product data and user profile |
| **Token Expiry** | 15-min access tokens reduce security risk |
| **Async/Await** | Non-blocking database operations |
| **Lazy Loading** | Angular loads routes on demand |

---

## Conclusion

This e-commerce application implements a modern, secure architecture separating concerns into distinct layers:

1. **Presentation Layer (Angular)** - User interface
2. **API Layer (Express)** - Endpoint handlers and routing
3. **Business Logic (Services)** - Core application logic
4. **Data Access (Repositories)** - Database queries
5. **Database (MySQL)** - Data storage

The connection between frontend and database is managed through REST APIs, with Express.js as the intermediary handling all business logic, authentication, and data validation.
