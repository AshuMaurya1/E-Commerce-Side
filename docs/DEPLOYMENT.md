# Vercel + Render Deployment

## Render backend

1. Create a new Render Web Service from this Git repository.
2. Select Docker as the runtime.
3. Set Dockerfile path to `backend/Dockerfile` and Docker context to the repository root.
4. Set the health check path to `/actuator/health`.
5. Add the environment variables below.

### Required backend variables

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_HOST=<MySQL host>`
- `DB_PORT=3306`
- `DB_NAME=<MySQL database name>`
- `DB_USERNAME=<MySQL username>`
- `DB_PASSWORD=<MySQL password>`
- `DB_USE_SSL=true` for MySQL hosts that require TLS
- `FRONTEND_URL=https://<your-project>.vercel.app`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=None`
- `JWT_SECRET=<random 32-plus-character secret>`
- `APP_SEED_ADMIN_EMAIL=<production admin email>`
- `APP_SEED_ADMIN_PASSWORD=<strong production admin password>`
- `APP_PAYMENT_SIMULATION_ENABLED=false`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for persistent image uploads

The repository includes `render.yaml`, which can be imported as a Render Blueprint. Secret database and frontend values must still be entered in Render.

## Vercel frontend

1. Import the Git repository into Vercel.
2. Keep the repository root as the project root.
3. The root `vercel.json` proxies `/api/*` to `https://shopsphere-backend.onrender.com` by default, matching the Render service name in `render.yaml`.
4. If your Render service uses a different hostname, set `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1` in Vercel and redeploy the frontend.
5. Optionally set `VITE_RAZORPAY_KEY_ID` to the public Razorpay key ID.
6. Deploy the project.

The repository includes `vercel.json` for root-based Vite builds.

## After deployment

1. Replace `FRONTEND_URL` in Render with the final Vercel domain.
2. Redeploy the Render backend.
3. Use the production HTTPS URLs for Razorpay webhooks.
4. Use Cloudinary for persistent product image uploads; the local filesystem is ephemeral on hosted platforms.
5. Verify `/actuator/health` and then test login, refresh, cart, checkout, and admin uploads.
