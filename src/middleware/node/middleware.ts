// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/24#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "http";
type IncomingMessage = any;
type ServerResponse = any;

import { WebhookEventName } from "@octokit/webhooks-types";

import { Webhooks } from "../../index";
import { WebhookEventHandlerError } from "../../types";
import { MiddlewareOptions } from "./types";
import { getMissingHeaders } from "./get-missing-headers";
import { getPayload } from "./get-payload";

export const middleware = async <TTransform, TAdd>(
  webhooks: Webhooks<TTransform, TAdd>,
  options: Required<MiddlewareOptions<TAdd>>,
  request: IncomingMessage,
  response: ServerResponse,
  next?: Function
): Promise<any> => {
  let pathname: string;
  try {
    pathname = new URL(request.url as string, "http://localhost").pathname;
    options.log.debug(`${pathname} on url`);
  } catch (error) {
    response.writeHead(422, {
      "content-type": "application/json",
    });
    response.end(
      JSON.stringify({
        error: `Request URL could not be parsed: ${request.url}`,
      })
    );
    options.log.debug(`path error`);
    return;
  }

  const isUnknownRoute =
    request.method !== "POST" || !pathname.startsWith(options.path);
  const isExpressMiddleware = typeof next === "function";
  if (isUnknownRoute) {
    options.log.debug(`unknown url`);
    if (isExpressMiddleware) {
      options.log.debug(`unknown url next`);
      return next!();
    } else {
      options.log.debug(`unknown url unhandled`);
      return options.onUnhandledRequest(request, response);
    }
  }

  const missingHeaders = getMissingHeaders(request).join(", ");

  if (missingHeaders) {
    options.log.debug(`missing header`);
    response.writeHead(400, {
      "content-type": "application/json",
    });
    response.end(
      JSON.stringify({
        error: `Required headers missing: ${missingHeaders}`,
      })
    );

    return;
  }

  const eventName = request.headers["x-github-event"] as WebhookEventName;
  const signatureSHA256 = request.headers["x-hub-signature-256"] as string;
  const id = request.headers["x-github-delivery"] as string;

  options.log.info(`${eventName} event received (id: ${id})`);

  // GitHub will abort the request if it does not receive a response within 10s
  // See https://github.com/octokit/webhooks.js/issues/185
  let didTimeout = false;
  const timeout = setTimeout(() => {
    didTimeout = true;
    response.statusCode = 202;
    response.end("still processing\n");
  }, 9000);

  try {
    const payload = await getPayload(request);
    const additionalData = options.additionalDataExtractor
      ? options.additionalDataExtractor(request)
      : undefined;

    options.log.debug(`${additionalData} found on ${id}`);

    await webhooks.verifyAndReceive({
      id: id,
      name: eventName as any,
      payload: payload as any,
      signature: signatureSHA256,
      additionalData,
    });
    clearTimeout(timeout);

    if (didTimeout) return;

    response.end("ok\n");
  } catch (error) {
    clearTimeout(timeout);

    if (didTimeout) return;

    const statusCode = Array.from(error as WebhookEventHandlerError)[0].status;
    options.log.debug(`${error} error on ${id}`);
    response.statusCode = typeof statusCode !== "undefined" ? statusCode : 500;
    response.end(String(error));
  } finally {
    clearTimeout(timeout);
  }
};
