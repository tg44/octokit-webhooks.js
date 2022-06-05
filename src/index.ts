import { createLogger } from "./createLogger";
import { createEventHandler } from "./event-handler/index";
import { sign } from "./sign";
import { verify } from "./verify";
import { verifyAndReceive } from "./verify-and-receive";
import {
  EmitterWebhookEvent,
  EmitterWebhookEventName,
  HandlerFunction,
  RemoveHandlerFunction,
  Options,
  State,
  WebhookError,
  WebhookEventHandlerError,
  EmitterWebhookEventWithStringPayloadAndSignature,
  EmitterWebhookEventWithSignature,
} from "./types";

export { createNodeMiddleware } from "./middleware/node/index";
export { emitterEventNames } from "./generated/webhook-names";

// U holds the return value of `transform` function in Options
class Webhooks<TTransformed = unknown, TAdd = unknown> {
  public sign: (payload: string | object) => Promise<string>;
  public verify: (
    eventPayload: string | object,
    signature: string
  ) => Promise<boolean>;
  public on: <E extends EmitterWebhookEventName>(
    event: E | E[],
    callback: HandlerFunction<E, TTransformed, TAdd>
  ) => void;
  public onAny: (callback: (event: EmitterWebhookEvent<TAdd>) => any) => void;
  public onError: (callback: (event: WebhookEventHandlerError) => any) => void;
  public removeListener: <E extends EmitterWebhookEventName | "*">(
    event: E | E[],
    callback: RemoveHandlerFunction<E, TTransformed>
  ) => void;
  public receive: (event: EmitterWebhookEvent<TAdd>) => Promise<void>;
  public verifyAndReceive: (
    options:
      | EmitterWebhookEventWithStringPayloadAndSignature
      | EmitterWebhookEventWithSignature<TAdd>
  ) => Promise<void>;

  constructor(options: Options<TTransformed, TAdd> & { secret: string }) {
    const logger = createLogger(options.log);

    if (!options.secret) {
      logger.warn("Secret is not set or empty! Verify will missed out!");
    }

    const state: State & { secret: string } = {
      eventHandler: createEventHandler(options),
      secret: options.secret,
      hooks: {},
      log: logger,
    };

    this.sign = sign.bind(null, options.secret);
    this.verify = verify.bind(null, options.secret);
    this.on = state.eventHandler.on;
    this.onAny = state.eventHandler.onAny;
    this.onError = state.eventHandler.onError;
    this.removeListener = state.eventHandler.removeListener;
    this.receive = state.eventHandler.receive;
    this.verifyAndReceive = verifyAndReceive.bind(null, state);
  }
}

export {
  createEventHandler,
  Webhooks,
  EmitterWebhookEvent,
  EmitterWebhookEventName,
  WebhookError,
};
