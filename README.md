# <img src="assets/icons/gros-michel.png" width="56" align="absmiddle" /> Official Daily Banana

Once we drifted in turbulent currents, but now we sail a swifter tide. Welcome to the _Ghost of Gros Michel_ (formerly _HMS Laura_), a vessel dedicated to the daily pursuit of potassium-powered art. All hands on deck for the daily generate!

## API Key & Google AI Studio

To use the interactive "Generate Variant" and image generation features on this site, you will need a **Gemini API Key**.

### How to Create an API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click the **"Get API Key"** or **"Create API Key"** button.
4. You can either generate a key in a new project automatically, or select an existing Google Cloud project.
5. Copy the key and paste it into the AI Studio input box in the site's navigation bar.

### Nano Banana (Image Generation) Billing Requirements

While text-based prompt variation relies on models like _Gemini 2.5 Flash Lite_ (which work perfectly on the free tier), generating actual artwork via **Nano Banana** **strictly requires a Google Cloud Billing account**. Free tier keys have a hard quota of 0 RPM for image generation and will throw a `429 Quota Exceeded` error or a `403 Forbidden` error.

**Ways to associate a Billing Account:**

- **Option A (Upgrade an existing AI Studio Key):** If you let AI Studio automatically create a project for your key (usually named `generativelanguage-...`), go to the [Google Cloud Console Billing Page](https://console.cloud.google.com/billing), select that project from the dropdown, and link an active credit card/billing account to it.
- **Option B (Create a new Cloud Project):**
  1. Go to the [Google Cloud Console](https://console.cloud.google.com).
  2. Create a new Project and link a Billing Account to it.
  3. Search for the **Generative Language API** in the API library and enable it.
  4. Go back to AI Studio, click "Create API Key", and select your newly created, billing-enabled project from the dropdown list.
