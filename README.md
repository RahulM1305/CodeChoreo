# CodeChoreo

Link: https://codechoreo.onrender.com

A real-time collaborative code editor with AI assistance, built for seamless remote coding sessions.

![CodeChoreo Logo](client/src/assets/new_logo.png)

## 🌟 Features

### Real-time Collaboration
- **Multi-user Editing**: Multiple users can edit code simultaneously in the same room
- **Live Cursor Tracking**: See where other users are typing in real-time
- **Real-time Chat**: Built-in chat system for communication during coding sessions
- **Room-based Collaboration**: Create and join rooms with unique IDs for private sessions
- **User Status Indicators**: See who's online, typing, or disconnected

### Code Editor
- **Syntax Highlighting**: Support for multiple programming languages
- **File System Management**: Create, rename, and delete files and directories
- **Multiple File Support**: Work with multiple files in the same session
- **Error Detection**: Real-time error highlighting and suggestions
- **Output Console**: See code execution results in real-time

### Drawing & Visualization
- **Collaborative Whiteboard**: Draw and sketch ideas with other users
- **Real-time Drawing Sync**: See others' drawings as they happen
- **Multiple Drawing Tools**: Various tools for different visualization needs

### Video Calling
- **Integrated Video Calls**: Start video calls directly from the editor
- **Call Notifications**: Receive and respond to incoming call requests
- **Call Controls**: Mute/unmute audio and video during calls

### AI Assistance
- **Context-aware Code Suggestions**: Get intelligent code completions
- **Error Analysis**: Receive explanations and solutions for code errors
- **Code Explanations**: Understand code with AI-powered explanations
- **Room-specific Chat History**: Maintain context within each coding session

## 🛠️ Technologies Used

### Frontend
- **React**: UI framework for building the user interface
- **TypeScript**: Type-safe JavaScript for better code quality
- **Vite**: Next-generation frontend tooling for fast development
- **Socket.IO Client**: Real-time bidirectional communication
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Router**: Client-side routing for navigation
- **React Hot Toast**: Elegant notifications for user feedback

### Backend
- **Node.js**: JavaScript runtime for the server
- **Express**: Web framework for handling HTTP requests
- **Socket.IO**: Real-time bidirectional communication
- **TypeScript**: Type-safe JavaScript for better code quality
- **Dotenv**: Environment variable management

### Deployment
- **Render**: Cloud platform for hosting both frontend and backend
- **Docker**: Containerization for consistent deployment environments

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn
- Git

### Local Development Setup

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/CodeChoreo.git
cd CodeChoreo
```

2. **Set Up the Backend**
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
echo "PORT=3000" > .env

# Start development server
npm run dev
```

3. **Set Up the Frontend**
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env file
echo "VITE_BACKEND_URL=http://localhost:3000" > .env

# Start development server
npm run dev
```

4. **Access the Application**
- Open your browser and navigate to `http://localhost:5173`
- Create a new room or join an existing one using a room ID

### Creating and Joining Rooms

1. **Create a New Room**
   - Open the application
   - Enter your username
   - Click "Create New Room"
   - Share the generated room ID with others

2. **Join an Existing Room**
   - Open the application
   - Enter your username
   - Enter the room ID
   - Click "Join Room"

<!-- ## 🌐 Deployment

### Deploying to Render

1. **Backend Deployment**
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set the root directory to `server`
   - Configure build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables:
     - `PORT`: 3000
     - `NODE_ENV`: production

2. **Frontend Deployment**
   - Create a new Static Site on Render
   - Connect your GitHub repository
   - Set the root directory to `client`
   - Configure build command: `npm install && npm run build`
   - Set publish directory to `dist`
   - Add environment variables:
     - `VITE_BACKEND_URL`: Your backend URL (e.g., `https://your-backend.onrender.com`) -->

<!-- ## 🔧 Troubleshooting

### Common Issues

1. **Connection Problems**
   - Ensure both frontend and backend servers are running
   - Check that the `VITE_BACKEND_URL` in the frontend matches your backend URL
   - Verify that your firewall isn't blocking WebSocket connections

2. **Room Joining Issues**
   - Make sure you're using the correct room ID
   - Check that the room creator is still in the room
   - Try refreshing the page if the connection seems stuck

3. **Video Call Problems**
   - Ensure your browser has permission to access your camera and microphone
   - Check that you're using a supported browser (Chrome, Firefox, Edge)
   - Try refreshing the page if the video call interface isn't loading

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Your Name - Initial work - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Thanks to all the open-source libraries that made this project possible
- Special thanks to the Socket.IO team for their excellent real-time communication library -->

