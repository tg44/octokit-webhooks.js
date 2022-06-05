import { RequestError } from "@octokit/request-error";
import type {
  WebhookEventMap,
  WebhookEventName,
} from "@octokit/webhooks-types";
import { Logger } from "./createLogger";
import type { emitterEventNames } from "./generated/webhook-names";

export type EmitterWebhookEventName = typeof emitterEventNames[number];
export type EmitterWebhookEvent<
  TAdd = unknown,
  TEmitterEvent extends EmitterWebhookEventName = EmitterWebhookEventName
> = TEmitterEvent extends `${infer TWebhookEvent}.${infer TAction}`
  ? BaseWebhookEvent<TAdd, Extract<TWebhookEvent, WebhookEventName>> & {
      payload: { action: TAction };
    }
  : BaseWebhookEvent<TAdd, Extract<TEmitterEvent, WebhookEventName>>;

export type EmitterWebhookEventWithStringPayloadAndSignature = {
  id: string;
  name: EmitterWebhookEventName;
  payload: string;
  signature: string;
};

export type EmitterWebhookEventWithSignature<TAdd> =
  EmitterWebhookEvent<TAdd> & {
    signature: string;
  };

interface BaseWebhookEvent<TAdd, TName extends WebhookEventName> {
  id: string;
  name: TName;
  payload: WebhookEventMap[TName];
  additionalData?: TAdd;
}

export interface Options<TTransformed = unknown, TAdd = unknown> {
  secret?: string;
  transform?: TransformMethod<TTransformed, TAdd>;
  log?: Partial<Logger>;
}

type TransformMethod<T, TAdd> = (
  event: EmitterWebhookEvent<TAdd>
) => T | PromiseLike<T>;

export type HandlerFunction<
  TName extends EmitterWebhookEventName,
  TTransformed,
  TAdd
> = (event: EmitterWebhookEvent<TAdd, TName> & TTransformed) => any;

export type RemoveHandlerFunction<
  TName extends EmitterWebhookEventName | "*",
  TTransformed
> = (event: EmitterWebhookEvent<Exclude<TName, "*">> & TTransformed) => any;

type Hooks = {
  [key: string]: Function[];
};

export interface State extends Options<any, any> {
  eventHandler?: any;
  hooks: Hooks;
  log: Logger;
}

/**
 * Error object with optional properties coming from `octokit.request` errors
 */
export type WebhookError = Error & Partial<RequestError>;

// todo: rename to "EmitterErrorEvent"
export interface WebhookEventHandlerError extends AggregateError<WebhookError> {
  event: EmitterWebhookEvent;
}

/**
 * Workaround for TypeScript incompatibility with types exported by aggregate-error.
 * Credit: https://git.io/JUEEr
 * @copyright Sindre Sorhus
 * @license MIT (https://git.io/JUEEK)
 * @see https://github.com/octokit/webhooks.js/pull/270/files
 */
declare class AggregateError<T extends Error = Error>
  extends Error
  implements Iterable<T>
{
  readonly name: "AggregateError";
  constructor(errors: ReadonlyArray<T | { [key: string]: any } | string>);

  [Symbol.iterator](): IterableIterator<T>;
}
