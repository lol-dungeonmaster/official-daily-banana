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

### Pricing & Free Tier Rate Limits

Generating text-based variant prompts through this site relies on Google's Gemini Flash model family. 
The rates are fixed by Google's API pricing model and are not promotional. For the most up-to-date information, always refer to the official [Gemini API Pricing Page](https://ai.google.dev/gemini-api/docs/pricing) and [Rate Limits Page](https://ai.google.dev/gemini-api/docs/rate-limits).

**Free Tier (No Billing Account):**
*   **Cost:** $0.00
*   **Data Privacy:** For transparency, the [Gemini API Terms of Service](https://ai.google.dev/gemini-api/terms) explicitly states that for the free tier (Unpaid Services): *"To help with quality and improve our products, human reviewers may read, annotate, and process your API input and output... Do not submit sensitive, confidential, or personal information."* (This data collection does *not* apply to API keys connected to [an active Google Cloud billing account](#nano-banana-image-generation-billing-requirements)).
*   **Rate Limits:** Capped at **15 Requests Per Minute (RPM)**, 1 million Tokens Per Minute (TPM), and 1,500 Requests Per Day (RPD). If you click the Variant button too rapidly, the site will catch a `429 Rate Limit Exceeded` error and notify you to wait.

**Cost Breakdown per Model:**
If you attach a billing account to bypass the rate limits, generating short text variants is staggeringly inexpensive. Because our prompts are highly structured and short (averaging ~250 input tokens and ~150 output tokens):
*   **2.5 Flash Lite ($):** ~15,000 variants per $1.00
*   **3.1 Flash Lite ($$):** ~8,000 variants per $1.00
*   **3.5 Flash Lite ($$$):** ~6,000 variants per $1.00
*   **2.5 Flash ($$$$):** ~4,000 variants per $1.00

### Nano Banana (Image Generation) Billing Requirements

While text-based prompt variation relies on models like _Gemini 2.5 Flash Lite_ (which work perfectly on the free tier), generating actual artwork via **Nano Banana** **strictly requires a Google Cloud Billing account**. Free tier keys have a hard quota of 0 RPM for image generation and will throw a `429 Quota Exceeded` error or a `403 Forbidden` error.

**Ways to associate a Billing Account:**

- **Option A (Directly in AI Studio - Easiest):**
  1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and view your existing API keys.
  2. Click the **"Set up billing"** button or link next to the key you want to upgrade.
  3. Follow the prompts to link a credit card.
- **Option B (Upgrade an existing key via Cloud Console):** If you let AI Studio automatically create a project for your key (usually named `generativelanguage-...`), you can upgrade it manually:
  1. Go to the [Google Cloud Console Billing Page](https://console.cloud.google.com/billing) and create/select an active billing account.
  2. In the left sidebar, click **"Account Management"** (or "My Projects").
  3. Find the auto-generated `generativelanguage-...` project in the list, click the three dots next to it, and select **"Change Billing"** to link it to your active credit card.
- **Option C (Create a new Cloud Project):**
  1. Go to the [Google Cloud Console](https://console.cloud.google.com).
  2. Create a new Project and link a Billing Account to it.
  3. Search for the **Generative Language API** in the API library and enable it.
  4. Go back to AI Studio, click "Create API Key", and select your newly created, billing-enabled project from the dropdown list.\n

## License

This repository uses a dual-licensing structure:

- **Codebase (MIT License):** All software, scripts, HTML, CSS, and structural code are licensed under the [MIT License](LICENSE).
- **Artwork & Prompts (CC BY 4.0):** All AI-generated images, artwork, and carefully engineered textual prompts are licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/). You are completely free to share, adapt, and use these images (even commercially), provided you give appropriate credit and link back to this repository.
