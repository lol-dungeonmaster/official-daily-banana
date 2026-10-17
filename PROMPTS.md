# Prompt Formatting & Multi-Prompt Tabbing Reference

This document details how prompts are structured in `index.md` and `db26.ipynb`, including all supported syntax options for breaking multi-part or sequential prompts into interactive UI tabs via [`assets/js/collapse.js`](assets/js/collapse.js).

_(See also: [TAGS.md](TAGS.md) for the complete reference of supported Topic, Setting, and Style tags.)_

---

## 1. Core HTML Requirements in `index.md`

1. **Single-Line Flattening:** Inside `index.md`, the entire `<pre class="highlight"><code>...</code></pre>` block for an entry **must** reside on a single contiguous HTML line with no physical newline characters (`\n`) between `<p>` tags.
2. **Use `<strong>` Instead of Heading Tags:** Convert Markdown bold (`**...**`) to `<strong>...</strong>` and Markdown italics (`*...*`) to `<em>...</em>`. Never use `<h1>`–`<h6>` inside prompt blocks.
3. **Automatic Negative Prompt Hoisting:** Any `<strong>[NEGATIVE]</strong> ...` segment inside a prompt paragraph is automatically extracted by [`assets/js/collapse.js`](assets/js/collapse.js) and hoisted into a red-labeled `Negative prompt:` container above the main prompt text.

---

## 2. Supported Tab Header Formats (Multi-Prompt Tabs)

Tab splitting in [`assets/js/collapse.js`](assets/js/collapse.js) activates automatically whenever a prompt contains **2 or more** `<p>` elements whose leading `<strong>` text matches one of the 5 supported header patterns below:

```regex
/^(Scene \d+|Step \d+|Variant [A-Z0-9]|\d+\.\s+[A-Za-z0-9]|[A-Za-z0-9\s]+:\s*\[|[A-Za-z0-9\s]+:)/i
```

| Option                           | Markdown Input (`db26.ipynb`)                 | HTML in `index.md`                                       | Rendered Tab Button Label |
| :------------------------------- | :-------------------------------------------- | :------------------------------------------------------- | :------------------------ |
| **A. `Step <N>`**                | `**Step 1: The Queen (Base Image)**`          | `<p><strong>Step 1: The Queen (Base Image)</strong></p>` | `Step 1`                  |
| **B. `Scene <N>`**               | `**Scene 1: The Push (Base Image)**`          | `<p><strong>Scene 1: The Push (Base Image)</strong></p>` | `Scene 1`                 |
| **C. `Variant <A-Z0-9>`**        | `**Variant A (Wide Shot):**`                  | `<p><strong>Variant A (Wide Shot):</strong></p>`         | `Variant A`               |
| **D. Numbered (`<N>. <Title>`)** | `**1. The Awakening (Part I)**`               | `<p><strong>1. The Awakening (Part I)</strong></p>`      | `1. The Awakening`        |
| **E. Custom Label + Colon**      | `**Base Image:**` or `**Part One: [MEDIUM]**` | `<p><strong>Base Image:</strong></p>`                    | `Base Image` / `Part One` |

> **Tab Button Label Rule:** Everything from the first colon (`:`) or opening parenthesis (`(`) onward in the header is automatically stripped when generating the compact tab button label (`.replace(/(:|\().*/, "").trim()`), while the full header text remains visible inside the tab body.

---

## 3. Structuring Shared vs. Self-Contained Tab Content

You can organize paragraphs around your tab headers using either of the following two patterns:

### Pattern 1: Self-Contained Steps / Scenes (Recommended for Distinct Prompts)

Each tab header is followed by its own complete `**[NEGATIVE]** ... **[MEDIUM]** ... **[SETTING]** ... **[CHARACTERS BASE]** ... **[EVENT MODIFIERS]**` paragraph. An optional overall title paragraph can be placed at the very top:

```markdown
**The Futility of the Spear King**

**Step 1: The Queen (Base Image)**
**[NEGATIVE]** ... **[MEDIUM]** ... **[SETTING]** ... **[CHARACTERS BASE]** ... **[EVENT MODIFIERS]** ...

**Step 2: The End (Image-to-Image Reference)**
**[NEGATIVE]** ... **[MEDIUM]** ... **[SETTING]** ... **[CHARACTERS BASE]** ... **[EVENT MODIFIERS]** ...
```

### Pattern 2: Shared Base Prompt + Per-Step Modifiers (Requires `multi-step` Tag)

When the `<article>` in `index.md` includes `multi-step` in its `data-tags` attribute (`data-tags="...,multi-step"`), any base paragraphs placed **before** the first tab header (such as an overall title and a shared `**[MEDIUM]** ... **[SETTING]** ... **[CHARACTERS BASE]**` paragraph) are **automatically cloned into the top of every tab**:

```markdown
**Triceratops (Sequential Image-to-Image Narrative)**

**[MEDIUM]** Shared medium... **[SETTING]** Shared setting... **[ANIMALS BASE]** Shared anatomy...

**Scene 1: The Push (Base Image)**
**[NEGATIVE]** ... **[EVENT MODIFIERS]** Scene 1 specific action...

**Scene 2: The Prize (Image-to-Image Reference)**
**[NEGATIVE]** ... **[PIPELINE RULE]** ... **[EVENT MODIFIERS]** Scene 2 specific action...
```

> **Without `multi-step`:** If an entry has multiple tabs but does **not** include the `multi-step` tag, any paragraphs placed before the first tab header stay fixed above the tab bar rather than being cloned into each tab.

---

## 4. Special Paragraph Modifiers (Subheadings & Appendix)

- **Bold-Italic Subheadings (`***Subheading***`):** Any paragraph consisting entirely of bold+italic text (`<p><strong><em>...</em></strong></p>`) placed immediately above a tab header is automatically pulled into that tab's content container.
- **Persistent Footer Appendix (`**Appendix: ...**`):** Any paragraph containing `Appendix:` (such as the sequential pipeline Gist link) at the end of the prompt block remains pinned below all tabs and is automatically stripped out when a user clicks the `✂️` Copy to Clipboard button:

  ```html
  <p>
    <strong
      >Appendix: Sequential Image-to-Image Narrative Pipeline (Gemini
      API)</strong
    ><br /><a
      href="https://gist.github.com/lol-dungeonmaster/2a0adf76479895b45a8664ca7c0602e3"
      target="_blank"
      class="prompt-link"
      >sequential_image_pipeline.py</a
    >
  </p>
  ```

  _(Note: Per convention, the Appendix is included in `index.md` for `multi-step` entries but omitted from `db26.ipynb`.)_

---

**Last Updated:** October 16, 2026
