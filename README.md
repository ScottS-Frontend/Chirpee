Chirpee 🐦

Full-Stack Social Media Web Application (React + Firebase)

Chirpee is a full-stack social media application inspired by Twitter/X. It allows users to create accounts, post content with optional images, reply to posts in real time, like posts, follow other users, and view personalized feeds.

The project was built to simulate real production architecture, including scalable Firestore data modeling, denormalized display data for performance, and real-time data synchronization using snapshot listeners.

🚀 Live Features

User authentication (Firebase Auth)

Create posts with optional image uploads

Real-time global feed and following feed

Reply system with live updates

Like / Unlike functionality

Profile pages with avatars and bios

Follow / Unfollow users

Dark / Light theme toggle with smooth transitions

Seed script for generating realistic demo data

🧠 Architecture Highlights
Denormalized Social Data Model

To avoid expensive read fan-out:

Display name, handle, and avatar stored on tweets and replies

Enables fast feed rendering with minimal queries

Real-Time Firestore Listeners

Used onSnapshot() to power:

Live feed updates

Live reply threads

Profile post updates

Security

Firestore rules enforce:

Users can only modify their own content

Protected user handle uniqueness

Controlled write access to social actions

🛠 Tech Stack

Frontend

React

Vite

React Router

CSS Variables Theming

Backend / Cloud

Firebase Authentication

Firestore (NoSQL Database)

Firebase Storage (Images)

Tooling

Node.js

Faker.js (Seed Data Generation)

Local Setup:
git clone <repo>
cd chirpee
npm install
npm run dev

Demo Data:
node scripts/seed.mjs --reset

🎯 What I Learned

Designing scalable NoSQL social data structures

Real-time UI architecture with Firestore

Authentication + protected routing patterns

Theme systems using CSS variables

Building realistic demo environments with seeded data