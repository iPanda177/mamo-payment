import prisma from "~/db.server";
import {LATEST_API_VERSION} from "@shopify/shopify-app-remix/server";
import {json} from "@remix-run/node";

export async function action({ request }) {
  // try {
    const refund = await request.json();

    console.log(refund)

    if (refund.refund_status === 'success') {
      const payment = await prisma.payment.findUnique({
        where: {
          mamoPaymentId: refund.id,
        }
      });

      console.log(payment)

      if (!payment) {
        return json({ error: 'No payment found' }, { status: 404 });
      }

      const shop = await prisma.shop.findUnique({
        where: {
          shop: payment.shop,
        }
      });

      if (!shop) {
        return json({ error: 'No shop found' }, { status: 404 });
      }

      const session = await prisma.session.findUnique({
        where: {
          id: shop.sessionId,
        }
      });

      if (!session) {
        return json({ error: 'No session found' }, { status: 404 });
      }

      if (payment) {
        const resolveRefundSession = await fetch(`https://${payment.shop}/payments_apps/api/${LATEST_API_VERSION}/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              accept: 'application/json',
              "X-Shopify-Access-Token": session.accessToken
            },
            body: JSON.stringify({
              query: `
            mutation RefundSessionResolve($id: ID!) {
              refundSessionResolve(id: $id) {
                refundSession {
                  id
                  state {
                    ... on RefundSessionStateResolved {
                      code
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
              variables: {
                id: payment.refundGid,
              },
            }),
          },
        );

        const resolveData = await resolveRefundSession.json();

        console.log(resolveData)

        if (resolveData.data.refundSessionResolve.refundSession.state.code === 'RESOLVED') {
          await prisma.payment.update({
            where: {
              mamoPaymentId: refund.id,
            },
            data: {
              status: 'refunded',
            }
          });
        }

        return json({ ok: true }, { status: 200 });
      }
    }

    return json({ ok: true }, { status: 200 });
  // } catch (err) {
  //   console.log(err)
  //   return json({ error: 'Something went wrong' }, { status: 200 });
  // }
}
