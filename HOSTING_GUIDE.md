# 🌐 Smart Inventory Management System

# Hosting & Deployment Guide

> A practical guide for running, hosting, deploying, and maintaining the Smart Inventory Management System.

---

## 📌 Table of Contents

1. [Project Hosting Overview](#-project-hosting-overview)
2. [Hosting Architecture](#-hosting-architecture)
3. [Requirements](#-requirements)
4. [Run Locally](#-run-locally)
5. [Deploy Using GitHub](#-deploy-using-github)
6. [Deploy Frontend on Netlify](#-deploy-frontend-on-netlify)
7. [Deploy Frontend on Vercel](#-deploy-frontend-on-vercel)
8. [Netlify Configuration](#-netlify-configuration)
9. [Vercel Configuration](#-vercel-configuration)
10. [Java Backend Hosting](#-java-backend-hosting)
11. [Frontend + Backend Architecture](#-frontend--backend-architecture)
12. [Database Integration](#-database-integration)
13. [Custom Domain](#-custom-domain)
14. [HTTPS](#-https)
15. [Environment Variables](#-environment-variables)
16. [Deployment Checklist](#-deployment-checklist)
17. [Troubleshooting](#-troubleshooting)
18. [Production Recommendations](#-production-recommendations)
19. [Recommended Future Architecture](#-recommended-future-architecture)

---

# 🚀 Project Hosting Overview

The Smart Inventory Management System contains two major parts:

```text
┌───────────────────────────────────────────────┐
│        SMART INVENTORY MANAGEMENT SYSTEM      │
└───────────────────────┬───────────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
       FRONTEND APPLICATION    JAVA BACKEND
              │                   │
              ▼                   ▼
        HTML/CSS/JS          Java / Spring Boot
              │                   │
              ▼                   ▼
       Netlify / Vercel       Backend Server
```

### Frontend

The frontend consists mainly of:

* HTML
* CSS
* JavaScript
* SVG assets
* Browser APIs
* localStorage
* BroadcastChannel
* Static configuration files

The frontend can be hosted on static hosting platforms.

### Backend

The repository also contains:

* Java backend
* REST API structure
* Spring Boot project structure
* Maven configuration

The backend requires a Java-compatible server environment when deployed as a real API.

---

# 🏗️ Hosting Architecture

## Current Demo Architecture

For the current portfolio/demo version:

```text
                  GitHub
                    │
                    ▼
                Netlify
                    │
                    ▼
              Static Frontend
                    │
                    ▼
               Web Browser
                    │
                    ▼
               localStorage
```

This setup allows the application to run without maintaining a separate database server.

---

# 🔄 Future Full-Stack Architecture

For a production-style implementation:

```text
                         USER
                          │
                          ▼
                    Web Browser
                          │
                          ▼
                   Netlify / Vercel
                          │
                          │ HTTPS
                          ▼
                 Spring Boot API
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
           Products     Sales      Purchases
              │           │           │
              └───────────┼───────────┘
                          ▼
                       Database
                    MySQL / PostgreSQL
```

---

# 🛠️ Requirements

## Frontend Development

Recommended:

* Git
* GitHub account
* Modern browser
* Python 3.x or another local web server
* Code editor such as VS Code

## Backend Development

Required when working with the Java backend:

* Java JDK
* Maven
* Spring Boot
* Database server when database integration is enabled

---

# 💻 Run Locally

## Method 1 — Python HTTP Server

Open a terminal inside the project folder.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

---

## Method 2 — Python 3 Explicit Command

On some systems:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

---

## Method 3 — Project Startup Script

The repository includes:

```text
start.bat
```

On Windows, double-click:

```text
start.bat
```

or execute:

```cmd
start.bat
```

Follow the instructions displayed by the script.

---

# 📁 Important Hosting Files

The project contains several files related to hosting and deployment.

```text
Smart-Inventory-Management-System/
│
├── netlify.toml
├── vercel.json
├── start.bat
├── HOSTING_GUIDE.md
└── README.md
```

### `netlify.toml`

Contains Netlify deployment configuration.

### `vercel.json`

Contains Vercel deployment configuration.

### `start.bat`

Provides a convenient Windows startup option.

### `HOSTING_GUIDE.md`

Contains hosting and deployment instructions.

---

# 🐙 Deploy Using GitHub

GitHub is used as the central source-code repository.

## Step 1 — Create Repository

Create a GitHub repository for the project.

Example repository name:

```text
Smart-Inventory-Management-System
```

---

## Step 2 — Initialize Git

From the project directory:

```bash
git init
```

---

## Step 3 — Add Files

```bash
git add .
```

---

## Step 4 — Create Commit

```bash
git commit -m "Initial project setup"
```

---

## Step 5 — Rename Branch

```bash
git branch -M main
```

---

## Step 6 — Add GitHub Remote

```bash
git remote add origin YOUR_GITHUB_REPOSITORY
```

---

## Step 7 — Push

```bash
git push -u origin main
```

After pushing, verify that the complete project appears in GitHub.

---

# 🌐 Deploy Frontend on Netlify

Netlify is suitable for the current frontend because the application is primarily a static web application.

## Method 1 — Deploy from GitHub

### Step 1

Sign in to Netlify.

### Step 2

Choose:

```text
Add new project
```

or the equivalent Git repository deployment option.

### Step 3

Connect GitHub.

### Step 4

Select:

```text
Smart-Inventory-Management-System
```

### Step 5

Configure the deployment.

For a static frontend, use the repository root if your `netlify.toml` is already configured.

### Step 6

Start deployment.

Netlify will:

```text
GitHub Repository
       ↓
Netlify Build
       ↓
Deploy Files
       ↓
Generate Website URL
```

---

# ⚙️ Netlify Configuration

The project contains:

```text
netlify.toml
```

A typical configuration for a static project can look like:

```toml
[build]
  publish = "."
```

If the actual frontend is intended to be served from another directory, update the publish directory accordingly.

For example:

```toml
[build]
  publish = "inventory-app"
```

### Important

Use the directory that actually contains the production `index.html`.

Before changing `netlify.toml`, verify where your application's entry page is located.

---

# 🔄 Automatic Netlify Deployment

When GitHub is connected to Netlify:

```text
Local Project
     ↓
git add .
     ↓
git commit
     ↓
git push
     ↓
GitHub
     ↓
Netlify detects change
     ↓
Automatic deployment
```

This means future changes can be published without manually uploading the website each time.

---

# 🌐 Deploy Frontend on Vercel

The repository also contains:

```text
vercel.json
```

Vercel can be used as an alternative static hosting platform.

## General process

```text
GitHub
   ↓
Vercel
   ↓
Import Repository
   ↓
Configure Project
   ↓
Deploy
   ↓
Public URL
```

### Steps

1. Sign in to Vercel.
2. Import the GitHub repository.
3. Select the project.
4. Verify the root directory.
5. Verify the build/output configuration.
6. Deploy the project.
7. Open the generated deployment URL.

---

# 🖼️ Verify Static Assets

After deployment, verify that all assets load correctly.

Important paths include:

```text
assets/images/products/tea.svg
assets/images/products/coffee.svg
assets/images/products/biscuits.svg
assets/images/products/peanuts.svg
assets/images/products/notebook.svg
assets/images/products/pens.svg
assets/images/products/cable.svg
assets/images/products/bulb.svg
assets/images/products/dishwash.svg
assets/images/products/cleaner.svg
assets/images/products/placeholder.svg
```

If images are missing after deployment, check:

* File paths
* Relative URLs
* Directory names
* File extensions
* Uppercase/lowercase differences

---

# ⚠️ Case-Sensitivity Warning

A website may work correctly on a Windows computer but fail after deployment because hosting environments can be case-sensitive.

For example:

```text
assets/images/products/Tea.svg
```

is different from:

```text
assets/images/products/tea.svg
```

Always ensure that the filename used in JavaScript or HTML exactly matches the actual filename.

---

# ☕ Java Backend Hosting

The Java backend is different from the static frontend.

A static hosting platform is intended primarily for serving frontend files.

The Java backend requires a runtime environment capable of running Java applications.

Possible backend hosting environments include:

* Cloud application platforms
* Virtual machines
* Docker containers
* Managed Java hosting
* Cloud infrastructure

The general deployment architecture is:

```text
Frontend
   │
   │ HTTPS
   ▼
Java / Spring Boot API
   │
   ▼
Database
```

---

# 🧩 Java Backend Deployment

## Backend Source

The repository contains:

```text
backend/
├── SmartInventoryServer.java
│
└── spring-boot/
    ├── pom.xml
    └── src/
```

The Spring Boot application uses Maven for dependency management.

Typical Maven commands are:

```bash
mvn clean
```

and:

```bash
mvn package
```

A Spring Boot project commonly produces a JAR file that can then be run on a Java-compatible server.

Example:

```bash
java -jar application.jar
```

> The exact command and JAR filename depend on the project's Maven configuration.

---

# 🔌 Frontend → Backend Connection

When the backend is deployed, the frontend should communicate with the API using the backend's public HTTPS address.

Example concept:

```text
Frontend
   │
   │ fetch()
   ▼
https://your-api-domain/api/products
```

JavaScript can communicate with the backend using requests such as:

```javascript
fetch("/api/products")
```

or, when the API is hosted separately:

```javascript
fetch("https://your-api-domain/api/products")
```

The actual production API URL should be configured separately rather than hard-coded throughout multiple JavaScript files.

---

# 🌍 CORS Configuration

When frontend and backend are hosted on different domains, Cross-Origin Resource Sharing (CORS) may need to be configured.

Example architecture:

```text
Frontend:
https://your-frontend-domain

Backend:
https://your-api-domain
```

The backend must allow requests from the frontend domain.

For Spring Boot, CORS can be configured through controller annotations or global Web MVC configuration.

Example concept:

```java
@CrossOrigin(origins = "https://your-frontend-domain")
```

For production, avoid allowing every origin unless there is a specific reason.

---

# 🗄️ Database Integration

The current standalone frontend uses browser storage.

A production application should use centralized server-side storage.

Recommended architecture:

```text
Frontend
   ↓
Spring Boot
   ↓
Service Layer
   ↓
Repository
   ↓
Database
```

Possible databases:

### MySQL

Suitable for structured inventory data.

### PostgreSQL

Suitable for larger and more advanced relational workloads.

---

# 📊 Recommended Database Tables

A future database could contain tables such as:

```text
products
sales
sale_items
purchases
purchase_items
customers
suppliers
users
settings
inventory_transactions
```

Possible relationship:

```text
Products
   │
   ├──────── Sale Items
   │
   └──────── Purchase Items

Customers
   │
   └──────── Sales

Suppliers
   │
   └──────── Purchases
```

---

# 🖼️ Production Image Storage

The current project can use local/static product images.

For a production system, images can be moved to cloud storage.

Possible architecture:

```text
User
 ↓
Upload Image
 ↓
Backend
 ↓
Cloud Storage
 ↓
Image URL
 ↓
Database
 ↓
Frontend
```

The database should generally store the image reference/URL rather than storing large image files directly inside normal product records.

---

# 🔐 Environment Variables

Never store sensitive credentials directly in:

```text
HTML
JavaScript
GitHub
README.md
```

Sensitive values should be stored using environment variables or a secure secret-management mechanism.

Examples include:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
API_SECRET
```

### Never commit:

```text
password=123456
apiKey=xxxxxxxx
databasePassword=xxxxxxxx
```

---

# 🔒 HTTPS

Production applications should use HTTPS.

Recommended architecture:

```text
Browser
   │
   │ HTTPS
   ▼
Frontend
   │
   │ HTTPS
   ▼
Backend API
   │
   ▼
Database
```

Avoid sending authentication credentials or business data over unencrypted HTTP in production.

---

# 🌍 Custom Domain

After deployment, the hosting platform will normally provide a generated domain.

A custom domain can later be connected.

Example:

```text
www.example.com
```

General process:

```text
Buy / Own Domain
       ↓
Hosting Platform
       ↓
Configure DNS
       ↓
Verify Domain
       ↓
Enable HTTPS
```

---

# 📱 Responsive Hosting Verification

After deployment, test the application on:

### Desktop

* Chrome
* Edge
* Firefox

### Mobile

* Android browser
* iPhone browser

Check:

* Navigation
* Product cards
* Tables
* Forms
* Modals
* Images
* Reports
* Buttons
* Responsive layout

---

# 🧪 Deployment Testing Checklist

After deploying the frontend, test the following.

## Application

* [ ] Homepage loads
* [ ] Login page loads
* [ ] Signup page loads
* [ ] Dashboard loads
* [ ] Products page loads
* [ ] Sales page loads
* [ ] Purchases page loads
* [ ] Customers page loads
* [ ] Suppliers page loads
* [ ] Reports page loads
* [ ] Settings page loads

## Products

* [ ] Add product
* [ ] Edit product
* [ ] Delete product
* [ ] Search product
* [ ] Product image loads
* [ ] Custom image works
* [ ] Barcode works
* [ ] QR code works

## Sales

* [ ] Add product to cart
* [ ] Change quantity
* [ ] Validate stock
* [ ] Create sale
* [ ] Stock decreases
* [ ] Invoice appears
* [ ] Invoice prints

## Purchases

* [ ] Add purchase
* [ ] Confirm purchase
* [ ] Stock increases
* [ ] Purchase record appears

## Synchronization

Open two or more browser tabs.

```text
Tab 1 → Sales
Tab 2 → Products
Tab 3 → Dashboard
```

Create a transaction and verify that the other tabs receive the update.

---

# 🐞 Troubleshooting

## Problem 1 — Page Not Found

### Check

* Correct publish directory
* Correct `index.html`
* Correct hosting configuration
* Correct file paths

---

## Problem 2 — CSS Not Loading

Check the stylesheet path.

Example:

```html
<link rel="stylesheet" href="css/style.css">
```

Verify that:

```text
css/style.css
```

actually exists relative to the HTML file.

---

## Problem 3 — JavaScript Not Loading

Check:

```html
<script src="js/app.js"></script>
```

Verify:

* Correct path
* Correct filename
* Correct extension
* Browser console for errors

---

## Problem 4 — Images Not Loading

Check:

```text
assets/images/products/
```

Make sure the referenced filename exactly matches the actual filename.

---

## Problem 5 — localStorage Data Is Missing

Browser storage is local to the browser/origin.

For example:

```text
localhost
```

and:

```text
your-netlify-site
```

do not share the same localStorage.

Therefore, data created locally will not automatically appear on the deployed website.

---

# ⚠️ Important localStorage Hosting Limitation

If the application is hosted on Netlify:

```text
User A Browser
     │
     └── localStorage
           │
           └── User A data


User B Browser
     │
     └── localStorage
           │
           └── User B data
```

The data is not automatically centralized.

Therefore, two different users will not share the same inventory unless a centralized backend/database is connected.

### Current model

```text
Browser
   ↓
localStorage
```

### Production model

```text
Browser
   ↓
REST API
   ↓
Database
```

---

# 🔄 Multi-Tab Synchronization Limitation

`BroadcastChannel` and browser storage events are useful for synchronizing tabs within the browser environment.

However, they are **not a replacement for server-side real-time synchronization between different users or devices**.

For example:

```text
Same Browser
├── Tab 1 ──┐
├── Tab 2 ──┼── BroadcastChannel
└── Tab 3 ──┘
```

works differently from:

```text
Laptop A
      │
      ▼
   Backend
      ▲
      │
      ▼
Laptop B
```

For multi-user real-time synchronization, a centralized backend or real-time service should be used.

---

# 🏭 Production Recommendations

Before using the system for real business operations, consider implementing:

## Backend

* Spring Boot REST API
* Centralized database
* API authentication
* Server-side validation
* Transaction management

## Security

* Password hashing
* JWT/session authentication
* Role-based authorization
* HTTPS
* CORS restrictions
* Secure file uploads
* Rate limiting

## Database

* MySQL or PostgreSQL
* Database backups
* Indexing
* Foreign keys
* Transaction handling

## Monitoring

* Application logs
* Error monitoring
* Server monitoring
* Database monitoring
* Automated backups

---

# 🚀 Recommended Production Architecture

A scalable version of the project could use:

```text
                         USERS
                           │
                           ▼
                    ┌─────────────┐
                    │  FRONTEND   │
                    │ Netlify     │
                    │ / Vercel    │
                    └──────┬──────┘
                           │
                         HTTPS
                           │
                           ▼
                    ┌─────────────┐
                    │ SPRING BOOT │
                    │ REST API    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          Products       Sales      Purchases
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌─────────────┐
                    │  DATABASE   │
                    │ MySQL / PG  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ BACKUPS /   │
                    │ MONITORING  │
                    └─────────────┘
```

---

# 📋 Final Deployment Checklist

Before sharing the project publicly:

```text
SOURCE CODE
☐ Code pushed to GitHub
☐ README completed
☐ HOSTING_GUIDE completed
☐ No passwords committed
☐ No API keys committed

FRONTEND
☐ index.html works
☐ CSS loads
☐ JavaScript loads
☐ Images load
☐ Navigation works
☐ Product management works
☐ Sales works
☐ Purchases work
☐ Reports work

HOSTING
☐ Netlify deployment successful
☐ Public URL works
☐ Mobile layout checked
☐ Browser console checked
☐ Static assets verified

BACKEND
☐ Java environment tested
☐ Maven configuration checked
☐ API endpoints tested
☐ CORS configured when required
☐ Database planned/configured

SECURITY
☐ No credentials in GitHub
☐ HTTPS enabled
☐ Authentication planned
☐ Authorization planned
☐ File upload validation planned
```

---

# 🏁 Conclusion

The Smart Inventory Management System can currently be hosted as a **static frontend application** using platforms such as Netlify or Vercel.

For portfolio and demonstration purposes, the frontend can operate using browser-based storage and synchronization.

For a production-ready multi-user application, the next stage is to connect:

```text
Frontend
   ↓
Spring Boot REST API
   ↓
MySQL / PostgreSQL
```

This allows the application to support centralized data, multiple users, authentication, persistent inventory records, secure APIs, and scalable business operations.

---

## 📌 Quick Hosting Summary

| Requirement                  | Recommended Approach    |
| ---------------------------- | ----------------------- |
| Source Code                  | GitHub                  |
| Frontend Hosting             | Netlify                 |
| Alternative Frontend Hosting | Vercel                  |
| Frontend Technology          | HTML / CSS / JavaScript |
| Demo Storage                 | localStorage            |
| Cross-Tab Sync               | BroadcastChannel        |
| Backend                      | Java / Spring Boot      |
| Backend API                  | REST                    |
| Database                     | MySQL / PostgreSQL      |
| Images                       | Static assets initially |
| Production Images            | Cloud storage           |
| Authentication               | JWT / Session           |
| Transport Security           | HTTPS                   |
| Version Control              | Git                     |
| Future Intelligence          | AI/ML forecasting       |

> **Deployment principle:** Keep the frontend simple and independently deployable today, while maintaining a clean architecture that allows the application to evolve into a secure, centralized, database-backed full-stack inventory platform tomorrow.
