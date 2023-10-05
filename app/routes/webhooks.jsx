import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      return { body: "OK", status: 200 };
    case "CUSTOMERS_DATA_REQUEST":
      return {body: "OK", status: 200 };
    case "CUSTOMERS_REDACT":
      return {body: "OK", status: 200 };
    case "SHOP_REDACT":
      return {body: "OK", status: 200 };
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }
  throw new Response();
};
