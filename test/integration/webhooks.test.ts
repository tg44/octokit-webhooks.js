import { readFileSync } from "fs";

import { sign } from "@octokit/webhooks-methods";

import { Webhooks, EmitterWebhookEvent } from "../../src";
import { toNormalizedJsonString } from "../../src/to-normalized-json-string";
import { createLogger } from "../../src/createLogger";

const pushEventPayloadString = readFileSync(
  "test/fixtures/push-payload.json",
  "utf-8"
);

describe("Webhooks", () => {
  test("new Webhooks() without secret option", () => {
    const partialLogger = {
      warn: jest.fn(),
    };
    const logger = createLogger(partialLogger);
    // @ts-expect-error
    new Webhooks({ log: logger });
    expect(partialLogger.warn).toHaveBeenCalledTimes(1);
    expect(partialLogger.warn).toHaveBeenCalledWith(
      "Secret is not set or empty! Verify will missed out!"
    );
  });

  test("webhooks.sign(payload) with object payload", async () => {
    const secret = "mysecret";
    const webhooks = new Webhooks({ secret });

    await webhooks.sign(JSON.parse(pushEventPayloadString));
  });

  test("webhooks.sign(payload) with string payload", async () => {
    const secret = "mysecret";
    const webhooks = new Webhooks({ secret });

    await webhooks.sign(pushEventPayloadString);
  });

  test("webhooks.verify(payload, signature) with object payload", async () => {
    const secret = "mysecret";
    const webhooks = new Webhooks({ secret });

    await webhooks.verify(
      JSON.parse(pushEventPayloadString),
      await sign({ secret, algorithm: "sha256" }, pushEventPayloadString)
    );
  });

  test("webhooks.verify(payload, signature) with object payload containing special characters", async () => {
    const secret = "mysecret";
    const webhooks = new Webhooks({ secret });

    const payload = {
      foo: "Foo\n\u001b[34mbar: ♥♥♥♥♥♥♥♥\nthis-is-lost\u001b[0m\u001b[2K",
    };

    await webhooks.verify(
      payload,
      await sign(secret, toNormalizedJsonString(payload))
    );
  });

  test("webhooks.verify(payload, signature) with string payload", async () => {
    const secret = "mysecret";
    const webhooks = new Webhooks({ secret });

    await webhooks.verify(
      pushEventPayloadString,
      await sign({ secret, algorithm: "sha256" }, pushEventPayloadString)
    );
  });

  test("webhooks.verifyAndReceive({ ...event, signature }) with string payload", async () => {
    const secret = "mysecret";
    const webhooks = new Webhooks({ secret });

    await webhooks.verifyAndReceive({
      id: "1",
      name: "push",
      payload: pushEventPayloadString,
      signature: await sign(
        { secret, algorithm: "sha256" },
        pushEventPayloadString
      ),
    });
  });

  test("webhooks.verifyAndReceive({ ...event, signature }) without secret", async () => {
    const secret = "";
    const webhooks = new Webhooks({ secret });

    await webhooks.verifyAndReceive({
      id: "1",
      name: "push",
      payload: pushEventPayloadString,
      signature: "bad_signature",
    });
  });

  test("webhooks.verifyAndReceive(event) with incorrect signature", async () => {
    const webhooks = new Webhooks({ secret: "mysecret" });

    const pingPayload = {} as EmitterWebhookEvent<unknown, "ping">["payload"];
    await expect(async () =>
      webhooks.verifyAndReceive({
        id: "1",
        name: "ping",
        payload: pingPayload,
        signature: "nope",
      })
    ).rejects.toThrow(
      "[@octokit/webhooks] signature does not match event payload and secret"
    );
  });

  test("webhooks.receive(error)", async () => {
    const webhooks = new Webhooks({ secret: "mysecret" });

    webhooks.onError((error) => {
      expect(error.message).toMatch(/oops/);
    });

    await expect(async () =>
      // @ts-expect-error
      webhooks.receive(new Error("oops"))
    ).rejects.toThrow();
  });
});
