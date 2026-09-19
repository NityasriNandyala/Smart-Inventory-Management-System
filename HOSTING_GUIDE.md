# How to Host Smart Inventory Management System Online (Not Locally)

This guide provides 3 free, fast ways to host this project on the web so anyone across the world can access it without running it on your local machine.

---

### Option 1: Netlify Drop (Fastest — 10 Seconds, No Command Line, 100% Free)

This is the easiest method requiring zero installation:

1. Open your browser and go to: **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
2. In Windows File Explorer, navigate to:
   `c:\Users\nandy\Downloads\smart-inventory-management-system`
3. Drag and drop the **`inventory-app`** folder directly into the browser circle on Netlify.
4. Netlify will immediately generate a permanent, live public HTTPS URL (e.g., `https://smart-inventory-demo.netlify.app`).
5. Share this URL with anyone!

---

### Option 2: GitHub Pages (Free Permanent Hosting)

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new repository named `smart-inventory-system`.
3. In the repository, upload or push the project files.
4. Go to repository **Settings** → **Pages**.
5. Under **Build and deployment** → **Source**, select `Deploy from a branch` and choose `/inventory-app` (or `root`).
6. Click **Save**. Within 1–2 minutes, your project will be live at:
   `https://<your-username>.github.io/smart-inventory-system/`

---

### Option 3: Vercel (1-Click Deployment)

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New** → **Project**.
3. Import your GitHub repository (or drag and drop via Vercel CLI).
4. Set Root Directory to: `inventory-app`.
5. Click **Deploy**. Your site will be live instantly with a free global SSL certificate.

---

### Default Login Accounts for Remote Users

Once hosted online, users can use either of these pre-configured accounts or click **Sign up** to create their own store:

- **Admin Account**:
  - Email: `admin@smartinventory.com`
  - Password: `admin123`
- **Manager Account**:
  - Email: `manager@smartinventory.com`
  - Password: `manager123`
