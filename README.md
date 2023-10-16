# Shopify Mamo Payment app - Remix

## Quick start

### Setup

Using yarn:

```shell
yarn install
```

Using npm:

```shell
npm install
```

Using pnpm:

```shell
pnpm install
```

### Local Development

Using yarn:

```shell
yarn dev
```

Using npm:

```shell
npm run dev
```

Using pnpm:

```shell
pnpm run dev
```

## Deployment

Add the variables below to your `.env` file:

```shell
SHOPIFY_APP_URL=your-app-url-with-https
PRODUCTION_API=https://business.mamopay.com/manage_api/v1
SANDBOX_API=https://sandbox.business.mamopay.com/manage_api/v1
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret-key
SCOPES=write_payment_gateways,write_payment_sessions
DATABASE_URL="file:prod.sqlite" (switch to "file:dev.sqlite" for local development)
```

### Application Storage

This template uses [Prisma](https://www.prisma.io/) to store session data, by default using an [SQLite](https://www.sqlite.org/index.html) database.
The database is defined as a Prisma schema in `prisma/schema.prisma`.

### Build

Remix handles building the app for you, by running the command below with the package manager of your choice:

Using yarn:

```shell
yarn build
yarn start
```

Using npm:

```shell
npm run build
npm run start
```

Using pnpm:

```shell
pnpm run build
pnpm run start
```
