require('dotenv').config();
const fetch = require('node-fetch');

async function registerWebhook() {
  const url = `${process.env.SANDBOX_API}/webhooks`;
  const options = {method: 'GET', headers: {accept: 'application/json'}};

  const webhooks = await fetch(url, options);
  const webhooksData = await webhooks.json();

  console.log(webhooksData.filter(webhook => webhook.url.includes(`${process.env.APP_URL_DEV}/refunded`)));

  if (!webhooksData.find(webhook => webhook.url.includes(`${process.env.APP_URL_DEV}/refunded`))) {
    const postOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${'24324t252f234552'}`
      },
      body: JSON.stringify({
        url: `${process.env.APP_URL_DEV}/refunded`,
        enabled_events: [
          'charge.refunded',
          'charge.refund_failed',
        ]
      }),
    };

    const createWebhook = await fetch(url, postOptions);
    console.log(await createWebhook.json());
  }
}

registerWebhook();
// (async function removeWebhook() {
//   const removing = await fetch(`https://sandbox.business.mamopay.com/manage_api/v1/webhooks/MPB-WH-2E8A745A8C`, {
//     method: 'DELETE',
//     headers: {
//       accept: 'application/json',
//       'Content-Type': 'application/json',
//     }
//   })
//
//
//   console.log(await removing.json())
// })();
