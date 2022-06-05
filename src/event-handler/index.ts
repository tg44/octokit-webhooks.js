import { createLogger } from "../createLogger";
import type {
  EmitterWebhookEvent,
  EmitterWebhookEventName,
  HandlerFunction,
  Options,
  State,
  WebhookEventHandlerError,
} from "../types";
import {
  receiverOn as on,
  receiverOnAny as onAny,
  receiverOnError as onError,
} from "./on";
import { receiverHandle as receive } from "./receive";
import { removeListener } from "./remove-listener";

interface EventHandler<TTransformed, TAdd> {
  on<E extends EmitterWebhookEventName>(
    event: E | E[],
    callback: HandlerFunction<E, TTransformed, TAdd>
  ): void;
  onAny(handler: (event: EmitterWebhookEvent<TAdd>) => any): void;
  onError(handler: (event: WebhookEventHandlerError) => any): void;
  removeListener<E extends EmitterWebhookEventName>(
    event: E | E[],
    callback: HandlerFunction<E, TTransformed, TAdd>
  ): void;
  receive(event: EmitterWebhookEvent<TAdd>): Promise<void>;
}

export function createEventHandler<TTransformed, TAdd>(
  options: Options<TTransformed, TAdd>
): EventHandler<TTransformed, TAdd> {
  const state: State = {
    hooks: {},
    log: createLogger(options && options.log),
  };

  if (options && options.transform) {
    state.transform = options.transform;
  }

  const onAnyTyped: (
    state: State,
    handler: (event: EmitterWebhookEvent<TAdd>) => any
  ) => void = onAny;

  return {
    on: on.bind(null, state),
    onAny: onAnyTyped.bind(null, state),
    onError: onError.bind(null, state),
    removeListener: removeListener.bind(null, state),
    receive: receive.bind(null, state),
  };
}
