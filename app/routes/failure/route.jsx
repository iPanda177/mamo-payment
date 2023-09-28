import {json} from "@remix-run/node";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const cancelUrl = url.searchParams.get('cancel_url');

    if (!cancelUrl) {
      return json({ error: 'No cancel url found' }, { status: 500 });
    }

    return json({}, {
      status: 302,
      headers: {
        'Location': cancelUrl,
      }
    });
  } catch (err) {
    return json({ err }, { status: 500 });
  }
};
