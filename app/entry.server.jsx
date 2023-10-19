import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import isbot from "isbot";

import { addDocumentResponseHeaders } from "./shopify.server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
  _loadContext
) {
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

  addDocumentResponseHeaders(request, responseHeaders);

  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
