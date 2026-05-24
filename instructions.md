Build a modern full-stack web application called DevCollab — a real-time developer collaboration workspace where users can create rooms, chat live, and collaborate on shared notes/code snippets.

Tech Stack:

Frontend: React.js + Vite + Tailwind CSS
Backend: Node.js + Express.js
Database: MongoDB
Authentication: JWT
Real-time communication: Socket.IO
State management: Context API or Redux Toolkit
Deployment-ready architecture

Core Features to Build First (Priority Order):

Authentication System
User signup/login
JWT-based authentication
Protected routes
Store token securely
Logout functionality
Workspace/Room System
Users can create collaboration rooms
Users can join existing rooms via room ID
Each room should display:
room title
active participants
created time
Real-Time Chat
Implement live messaging using Socket.IO
Messages should appear instantly for all connected users
Show sender name and timestamps
Persist chat messages in MongoDB
Shared Collaborative Notes
Create a shared editor/notes section inside each room
Changes should sync in real time between users
Auto-save notes to MongoDB
Dashboard UI
Clean modern responsive UI
Sidebar with rooms
Main collaboration area
Active users indicator
Dark theme preferred
Backend Architecture
Use scalable folder structure:
routes
controllers
middleware
models
sockets
services

Implement:

centralized error handling
request validation
reusable middleware
RESTful APIs
Database Models
Create MongoDB schemas for:
Users
Rooms
Messages
SharedNotes
Bonus Features (Only if time permits)
Typing indicators
Online/offline status
Room invite links
Code syntax highlighting
Redis caching
Rate limiting

UI Requirements:

Minimal modern design similar to Discord/Slack
Smooth transitions
Responsive layout
Professional dashboard appearance
Avoid generic beginner styling

Important:

Focus on building working core features first
Prioritize clean architecture and functionality over perfection
Write reusable components
Use environment variables properly
Keep code interview-friendly and easy to explain

Goal:
The project should be strong enough to showcase:

real-time systems
full-stack architecture
authentication
WebSocket communication
scalable backend structure
modern frontend development

Expected Final Resume Value:
A polished real-time collaboration platform demonstrating practical experience with MERN stack, Socket.IO, authentication systems, REST APIs, and scalable backend architecture.