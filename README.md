# E-Commerce App

An e-commerce platform with a customer storefront, admin dashboard, authentication, cart and checkout flow, order management, payments, reviews, notifications, and support chat.

## Features

### Public Storefront
- Landing page with hero, featured products, about section, testimonials, and footer.
- Login and signup flows.
- Product browsing and product detail viewing.
- Category-based catalog organization.

### Customer Features
- Authenticated customer dashboard.
- Cart management.
- Checkout flow.
- Order history and order details.
- Profile viewing and updates.
- Notifications for account and order activity.
- Customer support chat and message history.

### Admin Features
- Admin dashboard.
- Product management.
- Category management.
- User management.
- Order management and status updates.
- Admin notifications.
- Support thread management and replies.

### Backend Features
- REST API for auth, users, products, categories, cart, orders, payments, reviews, notifications, and support.
- MySQL database migrations and seed data.
- JWT-based auth flow with refresh token support.
- CORS configured for the Angular frontend.

## Tech Stack

- Frontend: Angular 21, TypeScript, SCSS, Chart.js
- Backend: Node.js, Express, MySQL
- Tooling: Vitest, Angular CLI, dotenv

## Project Structure

- `frontend/` - Angular app
- `backend/` - Express API and database logic
- `documentation/` - Database and route docs

## Quick Start

### Prerequisites
- Node.js installed
- MySQL running locally or remotely
- npm installed

### 1. Clone the repository

```bash
git clone https://github.com/JAY-AT/SE1
cd e-commerce-app
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with your database and server settings:

```env
BACKEND_PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=e-commerce
```

### 3. Run the backend

```bash
npm run dev
```

The backend starts the database initialization, migrations, and seeds automatically on launch.

### 4. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

### 5. Run the frontend

```bash
npm start
```

Open the app at `http://localhost:4200`.

## Available Routes

### Frontend Pages
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/user-dashboard` - Customer dashboard
- `/checkout` - Checkout page
- `/orders` - Order history
- `/profile` - Customer profile
- `/admin-dashboard` - Admin dashboard

### Backend API
- `/api/auth`
- `/api/user`
- `/api/products`
- `/api/cart`
- `/api/orders`
- `/api/payment`
- `/api/categories`
- `/api/reviews`
- `/api/notifications`
- `/api/support`

## Notes

- The frontend is configured to call the backend API at `http://localhost:3000/api` by default.
- The backend allows requests from `http://localhost:4200` during development.
- If you change `BACKEND_PORT`, update the frontend `apiBaseUrl` in `frontend/src/environments/environment.ts`.
- Database schema details live in `documentation/db/db.tables.md`.
- API route details live in `documentation/db/routes.md`.

## Scripts

### Backend
- `npm run dev` - Start the API in watch mode
- `npm start` - Start the API normally
- `npm run migrate` - Run database migrations

### Frontend
- `npm start` - Start the Angular dev server
- `npm run build` - Build the Angular app
- `npm test` - Run frontend tests

## License

No license has been specified for this project.
