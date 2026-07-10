# PerfectPie 🍕

PerfectPie is a modern web application featuring a **3D Interactive Pizza Builder** and a robust **Order Management System**. It allows users to build custom pizzas, view ingredients in 3D, apply coupons, place orders, track live orders, and manages administrative dashboards for analytics and stock monitoring.

---

## 🚀 Features

*   **3D Pizza Customizer:** Real-time 3D rendering to select bases, sauces, cheeses, and veggie/non-veg toppings.
*   **Live Order Tracking:** Real-time updates using Socket.IO as the kitchen updates order status.
*   **Smart Coupon System:** Flat & percentage discounts with minimum order validations.
*   **Admin Dashboard:** Comprehensive metrics charts, real-time stock levels, live order management, and catalog control.
*   **MongoDB Atlas Integration:** Reliable, production-ready cloud database storage.
*   **Robust Security:** Token-based JWT authorization, helmet protection, and API rate limiting.

---

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, TailwindCSS, Axios, Redux Toolkit, Three.js / React Three Fiber
*   **Backend:** Node.js, Express, Socket.IO, Mongoose, MongoDB Atlas
*   **Scheduler:** Cron jobs for automated inventory stock checks and notifications

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn
*   A MongoDB Atlas database instance (or a local MongoDB server)

---

### Installation & Run

#### 1. Clone the Repository
```bash
git clone https://github.com/Shashirdy/perfectpie.git
cd perfectpie
```

#### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=super_secret_perfect_pie_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

#### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Default Credentials

To explore the dashboard, log in with the pre-seeded admin account:
*   **Admin Email:** `admin@perfectpie.com`
*   **Admin Password:** `admin123`

---

## 📂 Project Structure

```
perfectpie/
├── backend/
│   ├── config/          # DB config, scheduler & cron
│   ├── controllers/     # API request logic
│   ├── middleware/      # Auth & validations
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express route declarations
│   └── server.js        # Entrypoint (Express & Socket.IO)
│
├── frontend/
│   ├── public/          # Static assets & textures
│   └── src/
│       ├── components/  # Navbars, footers, & 3D Canvas
│       ├── store/       # Redux Toolkit slices
│       └── pages/       # Login, customizer, tracking & admin views
```

---

## 📄 License
This project is open-source and available under the MIT License.
