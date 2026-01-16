#!/bin/bash

# RAG Chat Frontend Setup Script

echo "🚀 RAG Chat Frontend - Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Available commands:"
    echo "  npm run dev       - Start development server"
    echo "  npm run build     - Build for production"
    echo "  npm run preview   - Preview production build"
    echo "  npm run type-check - Check TypeScript types"
    echo ""
    echo "Next steps:"
    echo "1. Start your Flask API: cd .. && python src/app.py"
    echo "2. Start the frontend: npm run dev"
    echo "3. Open your browser to http://localhost:5173"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
