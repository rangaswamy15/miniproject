# Deploying to Render

This project is configured for easy deployment on [Render](https://render.com) using their "Blueprints" feature.

## Prerequisite
- A GitHub repository containing this code.

## Steps

1.  **Push to GitHub**: Ensure this code is pushed to your GitHub repository.
2.  **Create Blueprint in Render**:
    - Go to your [Render Dashboard](https://dashboard.render.com/).
    - Click **New +** and select **Blueprint**.
    - Connect your GitHub account if you haven't already.
    - Select the repository containing this project.
3.  **Apply Blueprint**:
    - Render will automatically detect the `render.yaml` file.
    - Review the resources to be created:
        - **Web Service**: The API and Frontend application.
        - **Database**: A PostgreSQL database.
    - Click **Apply**.

## What happens next?
- Render will provision a PostgreSQL database.
- It will build your application using `npm install && npm run build`.
- Once built, it will start the server using `npm start`.
- Render automatically injects the `DATABASE_URL` into your app, so no manual configuration is needed.

## Troubleshooting
- **Build Failures**: Check the logs in the Render dashboard. Ensure `npm run build` works locally first.
- **Database Connection**: The `render.yaml` automatically links the DB. If issues persist, verify the `DATABASE_URL` env var in the dashboard.
