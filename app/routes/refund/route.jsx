import {json} from "@remix-run/node";
import prisma from "~/db.server";

import * as dotenv from 'dotenv';
dotenv.config();

export async function action({ request }) {
  try {
    const refund = await request.json();
    const store = request.headers.get('Shopify-Shop-Domain');

    const payment = await prisma.payment.findUnique({
      where: {
        paymentId: refund.payment_id,
      }
    });

    console.log(refund, store, payment)

    const shopData = await prisma.shop.findUnique({ where: { shop: store } });

    if (!payment || payment.status !== 'resolved' || !shopData) {
      return json({ error: 'No payment found' }, { status: 404 });
    }

    await prisma.payment.update({
      where: {
        paymentId: refund.payment_id,
      },
      data: {
        status: 'refunding',
        refundGid: refund.gid,
      }
    });

    const createRefund = await fetch(`${process.env.SANDBOX_API}/charges/${payment.mamoPaymentId}/refunds`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${shopData.accessToken}`,
      },
      body: JSON.stringify({ amount: refund.amount }),
    });

    console.log(createRefund.ok)

    if (!createRefund.ok) {
      console.log('here')
      const error = await createRefund.json();
      console.log(error)
      return json({ error }, { status: createRefund.status });
    }

    return json({}, { status: 201 })
  } catch (err) {
    console.log(err);
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
}
