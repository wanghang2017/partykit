import { describe, it, expect, afterEach } from "vitest";
import { runPartykit } from "../cli";
import { WebSocket } from "ws";

const fixture = `${__dirname}/fixture.js`;

let dev: Awaited<ReturnType<typeof runPartykit>> | undefined;

const runDev: typeof runPartykit = async (...args) => {
  if (dev) {
    throw new Error("dev is already running");
  }
  dev = await runPartykit(...args);
  return dev;
};

afterEach(async () => {
  await dev?.close();
  dev = undefined;
});

describe("dev", () => {
  it("should error if no script path is provided", async () => {
    // @ts-expect-error we're purposely not passing a script path
    expect(runDev()).rejects.toThrowError("script path is missing");
  });

  it("should start a server for a given input script path", async () => {
    await runDev(fixture);
    const res = await fetch("http://localhost:3141/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot(
      '"Hello world from the room"'
    );
  });

  it("should start a server on a given port", async () => {
    await runDev(fixture, { port: 9999 });
    const res = await fetch("http://localhost:9999/party/theroom");
    expect(await res.text()).toMatchInlineSnapshot(
      '"Hello world from the room"'
    );
  });

  it("should let you connect to a room with a websocket", async () => {
    await runDev(fixture);
    const ws = new WebSocket("ws://localhost:3141/party/theroom");
    try {
      await new Promise((resolve) => ws.on("open", resolve));
      expect(ws.readyState).toBe(WebSocket.OPEN);
    } finally {
      ws.close();
    }
  });

  it("cannot connect to non-room path", async () => {
    await runDev(fixture);
    const ws = new WebSocket("ws://localhost:3141/notaroom");
    try {
      await new Promise((resolve) => ws.on("error", resolve));
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    } finally {
      ws.close();
    }
  });
});
