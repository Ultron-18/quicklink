# 🔗 QuickLink - URL Shortener Web Application

A modern, responsive URL shortener built with React, Vite, Tailwind CSS, and integrated with Rebrandly API. Transform long URLs into short, memorable links with custom slugs and beautiful animations.

## ✨ Features

- **URL Shortening**: Convert long URLs into short, shareable links
- **Custom Slugs**: Create personalized URLs with custom text
- **Link History**: Track and manage your recently created links
- **Copy to Clipboard**: One-click copying with visual feedback
- **Delete History**: Remove unwanted links from your history
- **Responsive Design**: Works perfectly on desktop and mobile
- **Modern UI**: Beautiful gradients, animations, and micro-interactions
- **Real-time Validation**: Input validation with helpful error messages

## 🚀 Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **API**: Rebrandly URL Shortener API
- **Backend**: Node.js/Express (for API key security)

## 📸 Screenshot

<img width="1234" height="1203" alt="image" src="https://github.com/user-attachments/assets/90fc0ae6-abe7-4880-a260-c4751dc183b4" />


## 📁 Project Structure

```
quicklink/
├── server/
│   ├── routes/
│   │   └── api.js              ✅ API routes with your Rebrandly key
│   ├── .env                    ✅ Environment variables configured
│   ├── server.js               ✅ Express server setup
│   └── package.json            ✅ Backend dependencies
├── src/
│   ├── components/
│   │   └── URLShortener.jsx    ✅ Updated React component
│   ├── App.jsx                 ✅ Main App component
│   ├── main.jsx                ✅ React entry point
│   └── index.css               ✅ Tailwind CSS styles
├── .env.example                ✅ Environment template
├── package.json                ✅ Frontend dependencies
├── tailwind.config.js          ✅ Tailwind configuration
├── vite.config.js              ✅ Vite configuration
└── README.md                   ✅ Complete documentation
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Rebrandly API account

### 1. Clone the Repository

```bash
git clone https://github.com/ultron-18/quicklink.git
cd quicklink
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Get Rebrandly API Key

1. Sign up at [rebrandly.com](https://www.rebrandly.com/)
2. Navigate to **Profile → API Keys**
3. Generate a new API key for your application

### 5. Environment Setup

Create `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Rebrandly API
REBRANDLY_API_KEY=your_rebrandly_api_key_here

# CORS Settings
FRONTEND_URL=http://localhost:5173
```

Create `.env.example` for reference:

```env
PORT=3001
NODE_ENV=development
REBRANDLY_API_KEY=your_rebrandly_api_key_here
FRONTEND_URL=http://localhost:5173
```

### 6. Run the Application

**Start Backend Server:**
```bash
cd server
npm run dev
```

**Start Frontend (in new terminal):**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application!

## 📦 Package.json Scripts

### Frontend (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### Backend (`server/package.json`)

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

## 🔧 Configuration Files

### `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### `tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
    },
  },
  plugins: [],
}
```

## 🔌 API Endpoints

### `POST /api/shorten`
Shorten a URL with optional custom slug

**Request Body:**
```json
{
  "url": "https://example.com/very-long-url",
  "customSlug": "my-custom-link" // optional
}
```

**Response:**
```json
{
  "success": true,
  "shortUrl": "https://rebrand.ly/my-custom-link",
  "originalUrl": "https://example.com/very-long-url",
  "id": "abc123"
}
```

### `GET /api/test`
Test API key validity

**Response:**
```json
{
  "success": true,
  "account": {
    "id": "your-account-id",
    "email": "your-email@example.com"
  }
}
```

## 🎨 Design Features

- **Modern Gradient Design**: Blue to purple gradients throughout
- **Smooth Animations**: Framer Motion for delightful interactions
- **Responsive Layout**: Mobile-first design approach
- **Dark/Light Themes**: Easy to extend with theme switching
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Loading States**: Visual feedback during API calls

## 🔒 Security Features

- **API Key Protection**: Secure server-side API key storage
- **Input Validation**: URL validation and sanitization
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Controlled cross-origin requests
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Update environment variables in deployment platform

### Backend (Railway/Heroku)

1. Push to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

### Environment Variables for Production

```env
NODE_ENV=production
REBRANDLY_API_KEY=your_production_api_key
FRONTEND_URL=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**API Key Error:**
- Verify your Rebrandly API key is correct
- Check if you've exceeded your monthly quota
- Ensure the API key has proper permissions

**CORS Issues:**
- Check FRONTEND_URL in your .env file
- Verify CORS middleware configuration

**Build Errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`

## 📞 Support

For support, please open an issue on GitHub or contact [your-email@example.com](mailto:your-email@example.com).

## 🎯 Roadmap

- [ ] User authentication and accounts
- [ ] Analytics dashboard
- [ ] Custom domains
- [ ] Bulk URL shortening
- [ ] QR code generation
- [ ] Link expiration settings
- [ ] API rate limiting by user
- [ ] Dark mode toggle

---

Made with ❤️ by [Ultron-18](https://github.com/ultron-18)
If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
