# Aurora Workspace Frontend

This directory contains the frontend application for **Aurora Workspace**, a modern collaboration platform for teams. It is built with React, Vite, and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To start the frontend development server:

```bash
npm run dev
```

This will start the Vite server, usually at `http://localhost:5173`. Open this URL in your browser to view the application.

> **Note:** This command runs *only* the frontend. To run the full stack (frontend + backend), please refer to the root `README.md` or run the backend separately.

## 🛠️ Tech Stack

-   **Framework:** [React](https://reactjs.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **Routing:** [React Router](https://reactrouter.com/)
-   **Charts:** [Chart.js](https://www.chartjs.org/) & [React Chartjs 2](https://react-chartjs-2.js.org/)

## 📂 Project Structure

-   `src/components`: Reusable UI components (Header, Layout, FeatureCard, etc.)
-   `src/pages`: Main application pages (Home, Login, Dashboard, etc.)
-   `src/context`: React Context for global state (Auth, Theme)
-   `src/assets`: Static assets like images and fonts

## ✨ Key Features

-   **Modern UI/UX:** Glassmorphism design, dark mode support, and responsive layout.
-   **Authentication:** Simulated login/signup flow with local storage persistence.
-   **Dashboard:** Kanban board, video calls, chat interface, and document management.
-   **Team Management:** Role-based access control for Team Heads and Members.

## 🎨 Theme

The application uses a custom "Aurora" color palette defined in `tailwind.config.js`. It supports both light and dark modes, respecting the user's system preference by default.
