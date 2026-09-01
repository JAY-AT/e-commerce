# Quick Reference: Database & Frontend Connection

## The 3-Tier Architecture

```
┌─────────────────────────┐
│   FRONTEND (Angular)    │  ← User Interface
│   Port: 4200            │
└────────────┬────────────┘
             │ JSON over HTTP
             │
┌────────────┴────────────┐
│  BACKEND (Express.js)   │  ← API & Business Logic
│  Port: 3000             │
└────────────┬────────────┘
             │ SQL Queries
             │
┌────────────┴────────────┐
│  DATABASE (MySQL)       │  ← Data Storage
└─────────────────────────┘
```

---

## How Frontend Talks to Backend

**Frontend sends HTTP request:**
```
POST http://localhost:3000/api/cart
Headers: { Authorization: "Bearer <token>" }
Body: { product_id: 5, quantity: 2 }
```

**Backend processes request:**
1. Check CORS (origin is localhost:4200? ✓)
2. Verify authentication token
3. Validate input data
4. Query database
5. Return JSON response

**Frontend receives response and updates UI:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": { "cart_item_id": 127, "quantity": 2 }
}
```

---

## Backend-to-Database Connection

**Connection Pool:** 20 reusable MySQL connections

```
Request #1 ─┐
Request #2 ─┼─→ [Connection Pool] ─→ MySQL Database
Request #3 ─┤
Request #4 ─┘
```

**Benefits:**
- Faster (reuse connections)
- Safer (manages resources)
- Scalable (handles 20+ simultaneous users)

---

## API Endpoints

| Route | Method | What it Does |
|-------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/products` | GET | List products |
| `/api/cart` | POST | Add to cart |
| `/api/orders` | POST | Create order |
| `/api/user/profile` | GET | Get user info |

---

## Database Tables

```
users ──→ orders
   ├──→ cart_items
   ├──→ addresses
   └──→ refresh_tokens

categories ──→ products
```

---

## Authentication Flow

1. **User logs in** → Frontend sends email + password
2. **Backend verifies** → Checks password hash in database
3. **Tokens generated** → access_token (15 min) + refresh_token (7 days)
4. **Frontend stores** → access_token in memory, refresh_token in secure cookie
5. **Future requests** → Frontend adds token to header: `Authorization: Bearer <token>`
6. **Backend validates** → Verifies token is valid before processing request

---

## Complete Request-Response Cycle

```
User clicks button
    ↓
Angular sends HTTP request
    ↓
Express receives & validates CORS
    ↓
Auth middleware checks token
    ↓
Validator checks data format
    ↓
Controller processes request
    ↓
Service applies business logic
    ↓
Repository builds SQL query
    ↓
MySQL executes query & returns data
    ↓
Response bubbles back up layers
    ↓
Angular receives JSON response
    ↓
Component updates UI
    ↓
User sees result
```

---

## Key Technologies

**Frontend:** Angular 21 + TypeScript + SCSS  
**Backend:** Node.js + Express.js  
**Database:** MySQL  
**Auth:** JWT (JSON Web Tokens)  
**Communication:** REST API over HTTPS

---

## Example: Adding Item to Cart

**Frontend (Angular):**
```typescript
addToCart(productId: number, quantity: number) {
  return this.http.post('/api/cart', {
    product_id: productId,
    quantity: quantity
  });
}
```

**Backend (Express):**
```javascript
router.post('/cart', authMiddleware, (req, res) => {
  // 1. Get user from token
  const userId = req.user.id;
  
  // 2. Call service
  const result = await cartService.addItem(userId, req.body);
  
  // 3. Send response
  res.json(result);
});
```

**Service:**
```javascript
async addItem(userId, data) {
  // Check if product exists
  // Check stock
  // Insert/update in database
  return { success: true, ... };
}
```

**Repository (Database Access):**
```javascript
static async addCartItem(userId, productId, quantity) {
  const [result] = await pool.query(
    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
    [userId, productId, quantity]
  );
  return result;
}
```

---

## Security Features

✓ **CORS** - Only frontend from localhost:4200 can access  
✓ **JWT Auth** - Tokens verify user identity  
✓ **Password Hashing** - Passwords stored as bcrypt hash (not plain text)  
✓ **Prepared Statements** - Prevents SQL injection  
✓ **HTTP-Only Cookies** - Refresh token can't be stolen by JavaScript  
✓ **Token Expiry** - Access token expires in 15 minutes  

---

## Development vs Production

### Development
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Database: Local MySQL

### Production
- Frontend: `https://example.com` (served by web server)
- Backend: `https://api.example.com` (deployed to cloud)
- Database: Remote MySQL (AWS RDS, etc.)

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Max concurrent connections | 20 |
| Connection pool queue | Unlimited |
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| DB connection reuse | ~90% faster |

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| CORS error | Frontend URL not whitelisted | Add to backend CORS config |
| 401 Unauthorized | Invalid/expired token | User needs to login again |
| Slow response | DB connection pool full | Increase connection limit |
| SQL error | Query syntax wrong | Check repository SQL |
| 404 Not Found | Route doesn't exist | Verify API endpoint URL |

---

## Summary

1. **Frontend (Angular)** makes HTTP requests to backend API
2. **Backend (Express)** validates requests and queries database
3. **Database (MySQL)** stores and returns data
4. **Backend** sends JSON response to frontend
5. **Frontend** updates user interface with data
6. **Connection Pool** manages efficient database access
7. **JWT Tokens** secure user authentication
8. **CORS** restricts frontend access for security

This architecture ensures **separation of concerns**, making the app:
- **Secure** - validation at each layer
- **Scalable** - connection pooling handles many users
- **Maintainable** - clear layers with specific responsibilities
- **Flexible** - easy to swap components or deploy remotely
