import {json} from "@remix-run/node";
import prisma from "~/db.server";

import * as dotenv from 'dotenv';
dotenv.config();

export async function action({ request }) {
  try {
    const payment = await request.json();
    console.log(payment)
    const store = request.headers.get('Shopify-Shop-Domain');
    const requestId = request.headers.get('Shopify-Request-Id');

    const haveRequest = await prisma.payment.findUnique({ where: { requestId } });

    if (haveRequest) {
      return json({ redirect_url: haveRequest.returnUrl }, { status: 200 });
    }

    const shopData = await prisma.shop.findUnique({ where: { shop: store } });

    if (!shopData) {
      return json({ error: 'No shop found' }, { status: 404 });
    }

    if (!payment.test && shopData.configStatus !== 'test') {
        return json({ error: 'Shop is not in test mode' }, { status: 404 });
    }

    const createPaymentLink = await fetch(`${payment.test ? process.env.SANDBOX_API : process.env.PRODUCTION_API}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${shopData.accessToken}`,
      },
      body: JSON.stringify({
        title: 'Shopify Cart',
        return_url: `${process.env.SHOPIFY_APP_URL}/success`,
        failure_return_url: `${process.env.SHOPIFY_APP_URL}/failure`,
        amount: payment.amount,
        amount_currency: payment.currency,
        enable_quantity: false,
        first_name: payment.customer.billing_address.given_name || payment.customer.shipping_address.given_name,
        last_name: payment.customer.billing_address.family_name || payment.customer.shipping_address.family_name,
        email: payment.customer.email,
        external_id: payment.id,
        platform: 'shopify',
        custom_data: {
          payment_id: payment.id,
          gid: payment.gid,
          shop: store,
          cancel_url: payment.payment_method.data.cancel_url,
        }
      }),
    })

    if (createPaymentLink.status !== 200 && createPaymentLink.status !== 201) {
      const error = await createPaymentLink.json();
      return json({ error }, { status: createPaymentLink.status });
    }

    const { payment_url } = await createPaymentLink.json();
    await prisma.payment.create({
      data: {
        requestId: requestId,
        returnUrl: payment_url,
        paymentId: payment.id,
        amount: payment.amount,
        status: 'created',
        shop: store,
      }
    })
    return json({ redirect_url: payment_url }, { status: 200 });
  } catch (err) {
    console.log(err)
    return json({ err }, { status: 500 });
  }
}
