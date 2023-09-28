import {json} from "@remix-run/node";
import prisma from "~/db.server";

import * as dotenv from 'dotenv';
import {LATEST_API_VERSION} from "@shopify/shopify-app-remix/server";
dotenv.config();

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const payment_id = url.searchParams.get('payment_id');
    const gid = url.searchParams.get('gid');
    const shop = url.searchParams.get('shop');

    if (!shop || !payment_id) {
      return json({ error: 'No shop found' }, { status: 500 });
    }

    const shopData = await prisma.shop.findUnique({
      where: {
        shop: shop,
      }
    });

    if (!shopData) {
      return json({ error: 'No shop found' }, { status: 404 });
    }

    const session = await prisma.session.findUnique({
      where: {
        id: shopData.sessionId,
      }
    })

    if (!session) {
      return json({ error: 'No session found' }, { status: 404 });
    }

    let tries = 0;
    let paymentResolved = false;

    do {
      tries++;
      const paymentResolve = await fetch(`https://${shop}/payments_apps/api/${LATEST_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          "X-Shopify-Access-Token": session.accessToken
        },
        body: JSON.stringify({
          query: `
            mutation PaymentSessionResolve(
              $id: ID!,
            ) {
              paymentSessionResolve(
                id: $id,
              ) {
                paymentSession {
                  id
                  state {
                    ... on PaymentSessionStateResolved {
                      code
                    }
                  }
                  nextAction {
                    action
                    context {
                      ... on PaymentSessionActionsRedirect {
                        redirectUrl
                      }
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            id: gid,
          },
        }),
      });

      const resolveData = await paymentResolve.json();

      if (resolveData.data.paymentSessionResolve.paymentSession.state.code === 'RESOLVED' ||
          resolveData.data.paymentSessionResolve.paymentSession.nextAction.action === 'resolved'
      ) {
        paymentResolved = true;

        await prisma.payment.update({
          where: {
            paymentId: payment_id,
          },
          data: {
            status: 'resolved'
          },
        });

        return json({}, {
          status: 302,
          headers: {
            'Location': resolveData.data.paymentSessionResolve.paymentSession.nextAction.context.redirectUrl,
          }
        });
      }

      if (tries === 5) {
        return json({ error: 'Payment not resolved' }, { status: 500 });
      }
    } while (paymentResolved === false && tries < 5);

    return json({ error: 'Payment not resolved' }, { status: 500 });
  } catch (err) {
    console.log(err)
    return null
  }
}
