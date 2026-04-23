# PetHub - Pet Care Management System

A comprehensive web application designed to manage and streamline pet care services, including clinic appointments, spa treatments, hotel accommodations, and pet transportation.

---

## Key Features

### For Customers

- **Service Booking:** Schedule appointments for the Pet Clinic, Spa & Grooming, and Pet Hotel.
- **Pet Shipment:** Arrange transportation for pets with automatic distance and price calculations utilizing the Goong Map API.
- **Online Payment:** Secure and seamless checkout process integrated with VNPay, MoMo, and PayPal.
- **Smart AI Assistant:** An intelligent Chatbot powered by Google Gemini to answer customer inquiries and verify real-time doctor availability.
- **Booking History:** Track pending, active, and completed bookings with transparent price breakdowns.

### For Administrators

- **Dashboard & Analytics:** Monitor total revenue, booking volumes, and overall customer statistics.
- **Doctor Management:** Add, update, remove, and manage doctor profiles and availability statuses.
- **News Management:** Publish and modify blog posts with image upload capabilities.
- **Booking Management:** Review, confirm, and cancel customer appointments effectively.

---

## Technology Stack

- **Frontend:** React.js, React Router DOM, Axios, Framer Motion, Bootstrap, CSS.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB, Mongoose.
- **Third-Party Integrations:** Google Gemini AI, PayPal SDK, VNPay, MoMo, Goong Map API.

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your local environment:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/pmt204/PetHub.git
   cd pethub
   ```

2. **Install Backend Dependencies:**

   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   ```

### Environment Variables

Create a `.env` file in the `server` directory and configure the required credentials:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Payment Gateways
VNPAY_TMNCODE=your_vnpay_code
VNPAY_HASHSECRET=your_vnpay_secret

# APIs
GEMINI_API_KEY=your_google_gemini_api_key
GOONG_API_KEY=your_goong_map_api_key
```

### Running the Application

1. **Start the Backend server:**

   ```bash
   cd server
   npm start
   ```

   _The server will start on http://localhost:5000_

2. **Start the Frontend client:**
   ```bash
   cd client
   npm start
   ```
   _The client will start on http://localhost:3000_

---

## Contributing

Contributions, issues, and feature requests are highly appreciated. Please refer to the issues page before submitting a pull request to ensure a smooth collaboration process.

## License

This project is licensed under the MIT License.
