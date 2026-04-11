# StockEase — Smart E-Commerce Inventory Management System

A full-stack MERN web application for managing inventory, orders, and suppliers for small e-commerce businesses.

> **Final Year Project — Bachelor of Information Technology**

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React.js + Tailwind CSS |
| Backend    | Node.js + Express.js    |
| Database   | MongoDB + Mongoose      |
| Auth       | JWT (JSON Web Tokens)   |
| Charts     | Recharts                |

---

## Features

- **Authentication** — Register/Login with JWT, role-based access (Admin / Employee)
- **Inventory Management** — Full CRUD for products with category and supplier linking
- **Stock Alerts** — Visual low-stock warnings on dashboard and product table
- **Order Management** — Create orders, auto-deduct stock, update status (Pending / Completed / Cancelled)
- **Supplier Management** — Store and manage supplier contact information
- **Dashboard** — Stats cards + bar chart + pie chart + recent activity

---

## How the System Works

### Overview

StockEase is a web-based inventory management system designed for small e-commerce businesses. It allows business owners and their staff to track products, manage stock levels, process orders, and maintain supplier records — all through a clean browser interface. The system is divided into two parts: a **backend API** (Node.js/Express) that handles all data and business logic, and a **frontend** (React.js) that provides the user interface.

---

### 1. User Authentication

When a user first opens the application, they are presented with a **Login** or **Register** page.

- During **registration**, the user provides their name, email, password, and role (Admin or Employee). The password is hashed using **bcrypt** before being saved to the database — meaning the actual password is never stored.
- During **login**, the system checks the submitted password against the hashed version stored in MongoDB. If they match, the server generates a **JWT (JSON Web Token)**, which is a secure string that acts as a digital pass.
- This token is stored in the browser's **localStorage** and is sent automatically with every subsequent request so the server knows who the user is.
- If a user tries to access any page without a valid token, they are redirected back to the login page.
- **Admins** have full access including deleting records. **Employees** can view, create, and update but cannot delete.

---

### 2. Dashboard

After logging in, the user lands on the **Dashboard**, which provides a real-time overview of the business:

- **Stats Cards** show the total number of products, total orders, number of low-stock items, and total revenue earned from completed orders.
- **Bar Chart** shows how many orders fall under each status (Pending, Completed, Cancelled).
- **Pie Chart** shows the proportional distribution of order statuses visually.
- **Low Stock Alerts** lists all products whose current quantity has dropped to or below their configured threshold, so the business knows what to reorder.
- **Recent Orders** shows the last 5 orders placed, with their status and amount.

All data on the dashboard is fetched from a single `/api/dashboard` endpoint that aggregates information from the Products, Orders, and Suppliers collections.

---

### 3. Inventory Management (Products)

The **Products** page is the core of the system. It displays all products in a table and allows the user to manage them.

- Each product has a **name**, **category**, **price**, **quantity**, **low stock threshold**, an optional **supplier**, and an optional **description**.
- Users can **search** products by name and **filter** by category or toggle a "Low Stock Only" view.
- When a product's quantity is at or below its low stock threshold, it is marked with an **"Low Stock"** badge in the table.
- Adding or editing a product opens a **modal form** — a popup dialog — so the user does not leave the page.
- Only **Admins** can delete products.

---

### 4. Order Management

The **Orders** page allows staff to create and track customer orders.

- When creating an order, the user selects one or more products and specifies quantities. The system shows available stock for each product in the dropdown.
- Before the order is saved, the backend **validates stock availability** — if any item lacks sufficient quantity, the order is rejected with a clear error message.
- Once the order is confirmed, the backend **automatically deducts** the ordered quantities from each product's stock. This ensures inventory is always accurate without requiring manual updates.
- Each order is assigned an auto-generated **order number** (e.g., `ORD-0001`).
- Orders can be in three states: **Pending**, **Completed**, or **Cancelled**.
- If an order is **cancelled**, the system **restores the deducted stock** back to the products, keeping the inventory correct.
- Clicking **View** on any order opens a detailed breakdown of the items, quantities, unit prices, and subtotals.

---

### 5. Supplier Management

The **Suppliers** page stores contact information for the businesses that supply the products.

- Each supplier record holds a name, email, phone number, address, and optional notes.
- Suppliers are displayed as **cards** for easy reading.
- When adding or editing a product, the user can **link it to a supplier** from a dropdown. This association is stored as a reference in the database and displayed on the product table.
- This makes it easy to trace back who supplies a given product when restocking is needed.

---

### 6. Data Flow (How Frontend and Backend Communicate)

```
User Action (e.g. clicks "Add Product")
        │
        ▼
React Component (Products.jsx)
        │  calls
        ▼
Service Layer (productService.js)
        │  sends HTTP request via Axios
        ▼
Express Route (POST /api/products)
        │  passes to
        ▼
Controller (productController.js)
        │  validates input, runs business logic
        ▼
Mongoose Model (Product.js)
        │  reads/writes to
        ▼
MongoDB Database
        │  returns result back up the chain
        ▼
React Component updates the UI
```

Every request to a protected route includes the JWT token in the request header. The **auth middleware** on the backend verifies the token before allowing the request to proceed.

---

### 7. Security Measures

| Concern | How It Is Handled |
|---|---|
| Password storage | Hashed with bcrypt (not stored as plain text) |
| API access control | JWT token required on all routes except login/register |
| Role enforcement | Admin-only actions checked in both middleware and UI |
| Input validation | express-validator checks all incoming request data |
| Error handling | Centralised error middleware returns consistent error responses |

---

## 📁 Project Structure

```
Stock-ease/
├── backend/
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth & error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── server.js           # App entry point
│   └── .env                # Environment variables
│
└── frontend/
    └── src/
        ├── components/     # Reusable UI components
        ├── context/        # React AuthContext
        ├── pages/          # Page-level components
        └── services/       # Axios API calls
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone <repo-url>
cd Stock-ease
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/stockease
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | /api/auth/register   | Register new user  |
| POST   | /api/auth/login      | Login              |
| GET    | /api/auth/me         | Get current user   |

### Products
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/products         | Get all products    |
| POST   | /api/products         | Create product      |
| PUT    | /api/products/:id     | Update product      |
| DELETE | /api/products/:id     | Delete product      |

### Orders
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/orders               | Get all orders       |
| POST   | /api/orders               | Create order         |
| PUT    | /api/orders/:id/status    | Update order status  |
| DELETE | /api/orders/:id           | Delete order         |

### Suppliers
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/suppliers        | Get all suppliers    |
| POST   | /api/suppliers        | Create supplier      |
| PUT    | /api/suppliers/:id    | Update supplier      |
| DELETE | /api/suppliers/:id    | Delete supplier      |

### Dashboard
| Method | Endpoint        | Description       |
|--------|-----------------|-------------------|
| GET    | /api/dashboard  | Get summary stats |

---

## 👤 User Roles

| Role     | Permissions                                   |
|----------|-----------------------------------------------|
| Admin    | Full access — including delete operations     |
| Employee | View, create, and update — no delete access   |

---

## 📚 Academic Notes

This project demonstrates:
- **MVC architecture** — Models, Controllers, Routes separated cleanly
- **RESTful API design** — Standard HTTP methods and status codes
- **JWT authentication** — Stateless, secure token-based auth
- **Input validation** — Server-side via express-validator
- **Error handling** — Centralized middleware
- **React patterns** — Context API for global state, protected routes, reusable components
- **Responsive UI** — Tailwind CSS utility-first styling
