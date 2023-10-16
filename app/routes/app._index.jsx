import {useCallback, useEffect, useState} from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  Divider,
  List,
  Link,
  TextField,
  BlockStack, InlineStack, Toast, Frame,
} from "@shopify/polaris";
import { LATEST_API_VERSION } from "@shopify/shopify-app-remix/server";
import { authenticate } from "~/shopify.server";
import prisma from "../db.server";
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const shopData = await prisma.shop.findUnique({
    where: {
      shop: session.shop,
    }
  });

  return shopData ? json({ shopData }) : json({ shopData: { shop: session.shop, accessToken: null, sessionId: session.id }});
};

export async function action({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session || !session.accessToken) {
      return json({ error: 'No session found' }, { status: 404 });
    }

    const data = {
      ...Object.fromEntries(await request.formData()),
    }

    const shopData = await prisma.shop.findUnique({
      where: {
        shop: data.shop,
      }
    });

    const checkValidToken = await fetch(`${process.env.PRODUCTION_API}/me`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${data.key}`,
      }
    });

    if (checkValidToken.status !== 200) {
      const error = await checkValidToken.json();
      return json({ status: 'Unauthorized', error }, { status: checkValidToken.status });
    }

    if (shopData) {
      const updatedShop = await prisma.shop.update({
        where: {
          shop: data.shop,
          },
        data: {
          accessToken: data.key,
        }
      });
      return json({ status: 'Updated', updatedShop }, { status: 200 });
    }

    await prisma.shop.create({
      data: {
        shop: data.shop,
        accessToken: data.accessToken,
        sessionId: session.id,
      }
    });

    const apiUrl = `https://${data.shop}/payments_apps/api/${LATEST_API_VERSION}/graphql.json`;
    const graphQlContent = `
      mutation paymentsAppConfigure($ready: Boolean!, $externalHandle: String!) {
        paymentsAppConfigure(ready: $ready, externalHandle: $externalHandle) {
          paymentsAppConfiguration {
            externalHandle
            ready
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const variables = {
      externalHandle: data.shop,
      ready: true,
    }
    const requestOptions = {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({
        query: graphQlContent,
        variables: variables,
      }),
    };

    const activatePayment = fetch(apiUrl, requestOptions)
        .then((response) => response.json())
        .then((data) => data.data.paymentsAppConfigure)
        .catch(error => console.log(error));

    console.log(activatePayment)
    return json({ status: 'Activated', activatePayment }, { status: 201 });
  } catch (err) {
    console.log(err);
    return json({ err }, { status: 500 })
  }
}

export default function Index() {
  const { shopData } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const [key, setKey] = useState(shopData.accessToken || '');
  const [isEditing, setIsEditing] = useState(false);
  const [activeToast, setActiveToast] = useState(false);

  useEffect(() => {
    if (actionData && actionData.status === 'Activated') {
      window.location.href = `https://${shopData.shop}/services/payments_partners/gateways/${'0e2f137681cd5353bf3566ec0d880b9c'}/settings`
    } else if (actionData && actionData.status === 'Unauthorized') {
      setActiveToast(true);
    }
  }, [actionData]);

  const toggleIsEditing = useCallback(() => setIsEditing((active) => !active), []);
  const handleChange = useCallback(
    (newValue) => setKey(newValue),
    [],
  );
  const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);

  const toastMarkup = activeToast ? (
    <Toast content="API key is unvalid" error onDismiss={toggleActiveToast} />
  ) : null;

  const saveAPIkey = async (key, shop) => {
    const data = {
      shop: shop,
      accessToken: key,
    }

    submit(data, { method: "post" });
  }

  return (
    <Page narrowWidth>
      <Frame>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Connect your Shopify Shop with Mamo Business:
                  </Text>

                  <List type={"bullet"}>
                    <List.Item>
                      <Text variant="bodyMd" as="p">
                        Create a new{" "}
                        <Link
                          url="https://dashboard.mamopay.com/"
                          target="_blank"
                        >
                          Mamo Business account
                        </Link>{" "}
                        or connect to an existing one
                      </Text>
                    </List.Item>

                    <List.Item>
                      <Text variant="bodyMd" as="p">
                        Navigate to the{" "}
                        <Link
                          url="https://dashboard.mamopay.com/manage/developer"
                          target="_blank"
                        >
                          Developer
                        </Link>{" "}
                        page
                      </Text>
                    </List.Item>

                    <List.Item>
                      <Text variant="bodyMd" as="p">
                        Copy your API key and paste it below
                      </Text>
                    </List.Item>
                  </List>

                  <Divider />

                  <TextField
                    label="API key"
                    value={key}
                    onChange={handleChange}
                    autoComplete="off"
                    disabled={shopData.accessToken && !isEditing}
                  />

                </BlockStack>
                <InlineStack gap="300" align="end">
                  <Button disabled={!shopData.accessToken} onClick={() => toggleIsEditing()}>
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>

                  <Button variant={"primary"} disabled={shopData.accessToken && !isEditing} onClick={() => saveAPIkey(key, shopData.shop)}>
                    Submit
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        {toastMarkup}
      </Frame>
    </Page>
  );
}
