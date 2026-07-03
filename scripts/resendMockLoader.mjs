/**
 * ESM loader hook used only by scripts/renderEmailTemplates.mjs.
 *
 * lib/email.ts does `import { Resend } from "resend"` and, when RESEND_API_KEY
 * is set, calls `resend.emails.send({ from, to, subject, html, text })`. The
 * template functions never return their HTML — it only exists as the argument
 * to that send call. So to preview the templates we redirect the "resend"
 * specifier to a tiny stub whose `emails.send` records every call onto
 * globalThis.__RENDERED_EMAILS instead of hitting the network.
 *
 * The stub is delivered as a data: URL module, so it loads into the SAME realm
 * as the main script and shares globalThis with it.
 */
const MOCK_SRC = `
export class Resend {
  constructor() {
    this.emails = {
      send: async (args) => {
        (globalThis.__RENDERED_EMAILS ||= []).push(args);
        return { data: { id: "mock-preview" }, error: null };
      },
    };
  }
}
`;

const MOCK_URL = "data:text/javascript," + encodeURIComponent(MOCK_SRC);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "resend") {
    return { url: MOCK_URL, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
