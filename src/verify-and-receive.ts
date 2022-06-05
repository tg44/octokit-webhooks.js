import { verify } from "@octokit/webhooks-methods";

import { toNormalizedJsonString } from "./to-normalized-json-string";
import {
  EmitterWebhookEventWithStringPayloadAndSignature,
  EmitterWebhookEventWithSignature,
  State,
} from "./types";

export async function verifyAndReceive<TAdd>(
  state: State & { secret: string },
  event:
    | EmitterWebhookEventWithStringPayloadAndSignature
    | EmitterWebhookEventWithSignature<TAdd>
): Promise<any> {
  // verify will validate that the secret is not undefined
  const matchesSignature = await verify(
    state.secret,
    typeof event.payload === "object"
      ? toNormalizedJsonString(event.payload)
      : event.payload,
    event.signature
  );

  if (!matchesSignature) {
    const error = new Error(
      "[@octokit/webhooks] signature does not match event payload and secret"
    );

    return state.eventHandler.receive(
      Object.assign(error, { event, status: 400 })
    );
  }
  const additionalData = (event as Record<string, unknown>).additionalData
    ? ((event as Record<string, unknown>).additionalData as TAdd)
    : undefined;

  return state.eventHandler.receive({
    id: event.id,
    name: event.name,
    payload:
      typeof event.payload === "string"
        ? JSON.parse(event.payload)
        : event.payload,
    additionalData,
  });
}
