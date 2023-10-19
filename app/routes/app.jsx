import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }) {
  await authenticate.admin(request);

  const url = `${process.env.SANDBOX_API}/webhooks`;
  const options = {method: 'GET', headers: {accept: 'application/json'}};

  const webhooks = await fetch(url, options);
  const webhooksData = await webhooks.json();

  console.log(webhooksData.filter(webhook => webhook.url.includes(`${process.env.SHOPIFY_APP_URL}/refunded`)));

  if (!webhooksData.find(webhook => webhook.url.includes(`${process.env.APP_URL}/refunded`))) {
    const postOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${process.env.SHOPIFY_APP_URL}/refunded`,
        enabled_events: [
          'charge.refunded',
          'charge.refund_failed',
        ]
      }),
    };

    const createWebhook = await fetch(url, postOptions);
    console.log(await createWebhook.json());
  }

  return json({ apiKey: process.env.SHOPIFY_API_KEY });
}

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp={false} apiKey={apiKey}>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
