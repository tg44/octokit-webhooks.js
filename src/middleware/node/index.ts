import { createLogger } from "../../createLogger";
import { Webhooks } from "../../index";
import { middleware } from "./middleware";
import { onUnhandledRequestDefault } from "./on-unhandled-request-default";
import { MiddlewareOptions } from "./types";
import { IncomingMessage, ServerResponse } from "http";

export function createNodeMiddleware<TTransformed, TAdd>(
  webhooks: Webhooks<TTransformed, TAdd>,
  {
    path = "/api/github/webhooks",
    onUnhandledRequest = onUnhandledRequestDefault,
    log = createLogger(),
    additionalDataExtractor = undefined,
  }: MiddlewareOptions<TAdd> = {}
) {
  const bindableMiddleware: (
    webhooks: Webhooks<TTransformed, TAdd>,
    options: Required<MiddlewareOptions<TAdd>>,
    request: IncomingMessage,
    response: ServerResponse,
    next?: Function
  ) => Promise<any> = middleware;

  return bindableMiddleware.bind(null, webhooks, {
    path,
    onUnhandledRequest,
    log,
    additionalDataExtractor,
  } as Required<MiddlewareOptions<TAdd>>);
}
