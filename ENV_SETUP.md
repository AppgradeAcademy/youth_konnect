# Environment Setup

## Database Configuration

This project uses a PostgreSQL database hosted on Render. 

**Important**: Create a `.env` file in the root directory with the following content:

```
DATABASE_URL="postgresql://rzeszow_youth_user:gVIAC8suj2kw14bObW3Ws2rUFRTrtojn@dpg-d5dq5gali9vc73dn9rb0-a.frankfurt-postgres.render.com/rzeszow_youth"
```

## Steps to Set Up

1. Create the `.env` file in the project root
2. Copy the DATABASE_URL above into the `.env` file
3. Run `npx prisma generate` to generate the Prisma client
4. Run `npx prisma db push` to push the schema to the database

The `.env` file is already in `.gitignore`, so it won't be committed to version control.




