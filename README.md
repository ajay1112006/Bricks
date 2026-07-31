# Bricks — Next.js Attendance & Order P&L Billing Application

"Bricks" is a production-ready Next.js (App Router) web application built with TypeScript, Tailwind CSS, Mongoose (MongoDB), and Zod schema validation.

It provides two core business management modules:
1. **Attendance Tracking Section**: 4 daily operational sessions with rapid Present/Absent mark-in toggles and session stats.
2. **Billing & Order Monitoring Section**: Order tracking, status management, itemized expense breakdowns, and an **interactive P&L Calibration Tool** to dynamically calculate and calibrate revenue, costs, and profit margin adjustments.

---

## Technical Stack & Architecture

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ORM & Connection Pooling (includes zero-config Mock Store fallback for immediate out-of-the-box preview)
- **Validation**: Zod runtime schema validation for API routes & forms
- **Styling**: Tailwind CSS v3 with sleek dark mode aesthetics & glassmorphism
- **Icons**: Lucide React

---

## Features Overview

### 1. Attendance Tracker Module (`/attendance`)
- **4 Sessions Per Day**:
  - `Session 1` (08:00 - 10:30) Morning Shift 1
  - `Session 2` (10:30 - 13:00) Morning Shift 2
  - `Session 3` (14:00 - 16:30) Afternoon Shift 1
  - `Session 4` (16:30 - 19:00) Afternoon Shift 2
- **Rapid Session Mark-in**:
  - Ordered employee roster with instant toggle switches (Green Present / Red Absent badges).
  - Bulk actions ("All Present", "All Absent").
  - Date selector and live session statistics (Staff count, Present, Absent, Presence Rate %).
  - Add staff member modal with role and department assignment.
- **MongoDB Persistence**: Saves complete session records with timestamps to MongoDB.

### 2. Billing & Profit Monitor Module (`/billing`)
- **Order Dashboard**: Total orders, In-progress vs Delivered metrics, Gross Revenue, Net Profit, and Average Profit Margin %.
- **P&L Calibration Tool**:
  - Interactive financial calibration modal per order.
  - Manual adjustment of revenue, material costs, labor costs, overhead, freight/shipping.
  - Margin Adjustment slider / numeric input (+ bonus rebate, - surcharge).
  - Live recalculation of Net Profit and Profit Margin %.
  - One-click calibration save to MongoDB.
- **Aggregated Financial Insights**:
  - Expense allocation breakdown.
  - Top margin order benchmark.
  - Loss alerts and margin risk indicators.

---

## Database Schemas (MongoDB / Mongoose)

### `Employee`
```typescript
{
  employeeId: string;   // Unique ID (e.g. EMP-001)
  name: string;         // Full Name
  role: string;         // Job Title / Role
  department: string;   // Department (e.g. Construction, Operations)
  status: "Active" | "Inactive";
  createdAt: Date;
}
```

### `Attendance`
```typescript
{
  date: string;         // YYYY-MM-DD
  session: number;      // 1 | 2 | 3 | 4
  records: Array<{
    employeeId: string;
    employeeName: string;
    status: "Present" | "Absent";
    timestamp: Date;
    notes?: string;
  }>;
  updatedAt: Date;
}
// Unique compound index on { date: 1, session: 1 }
```

### `Order`
```typescript
{
  orderId: string;               // Unique Order ID (e.g. ORD-8901)
  customerName: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
  }>;
  status: "Draft" | "In Progress" | "Delivered" | "Cancelled";
  revenue: number;
  costs: {
    materials: number;
    labor: number;
    overhead: number;
    shipping: number;
  };
  marginAdjustment: number;      // Manual P&L adjustment ($)
  netProfit: number;             // Revenue - Costs + MarginAdjustment
  profitMarginPercent: number;   // (NetProfit / Revenue) * 100
  notes?: string;
  date: string;
  createdAt: Date;
}
```

---

## API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/employees` | `GET` | List all employees |
| `/api/employees` | `POST` | Add a new employee (validated via Zod) |
| `/api/attendance` | `GET` | Fetch attendance for `?date=YYYY-MM-DD&session=N` |
| `/api/attendance` | `POST` | Batch save/update attendance for a session |
| `/api/orders` | `GET` | List orders (optional `?status=In Progress`) |
| `/api/orders` | `POST` | Create a new order with line items & baseline costs |
| `/api/orders/[id]` | `GET` | Fetch order details |
| `/api/orders/[id]` | `PUT` | Update order details or status |
| `/api/orders/[id]` | `DELETE` | Delete order |
| `/api/orders/[id]/calibrate` | `PUT` | **P&L Calibration tool endpoint** for manual revenue/cost/margin adjustments |
| `/api/seed` | `POST` | Seed database with demo employees & orders |

---

## Local Development & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration** (Optional for MongoDB Atlas):
   Create a `.env.local` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bricks?retryWrites=true&w=majority
   ```
   *(If `MONGODB_URI` is omitted, Bricks automatically runs in Mock Store mode with realistic seed data so you can test immediately!)*

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```
