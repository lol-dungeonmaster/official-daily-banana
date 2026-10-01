## Security Threat Modeling Rule

When running STRIDE linting, analyzing security architecture, or performing threat modeling on this repository, you must always follow this strict workflow:

1. Deeply consider the best mitigation strategy for each vulnerability or limitation found.
2. Explicitly append those mitigation strategies to the generated report or your response to the user.
3. Do not just list problems; always provide actionable solutions tailored to the static, serverless architecture of GitHub Pages.

## Python File Writing Rule

When modifying files (especially JSON or Markdown) using Python scripts and `json.dump` or `f.write`, you must ALWAYS manually append a trailing POSIX newline (`\n`) to the end of the file. This ensures standard Git formatting rules are respected and prevents `\ No newline at end of file` commit errors.

## The 5-Step Daily Entry Protocol

When requested to "add an entry" or follow "all standard 5-steps to add the entry", you must strictly perform the following actions across the architecture:

1. **Markdown Journal (`index.md`)**: Add the `<article>` wrapper, map all requested tags (`data-tags` attribute + `<span>` UI elements), setup the `.gallery-frame` with exact image dimensions using `file`, format the `<strong>` prompt headers, and define the global `switchGallery()` javascript toggle function in the `<script>` block.
2. **Jupyter Archive (`db26.ipynb`)**: Inject a text cell containing the raw unformatted markdown prompt with correct sequential headers (`1.`, `2.`), followed sequentially by individual markdown cells for every image using HTML `<img>` tags matching the native dimensions.
3. **Table of Contents (`_includes/nav.html`)**: Inject the numeric hyperlink (e.g., `<a href="#sep-28-26">28</a>`) sequentially into the `.nav-days-grid`.
4. **SEO Metatags (`_includes/head-custom.html`)**: Update `og:image`, `og:image:width`, `og:image:height`, `twitter:image`, and their corresponding `alt` text tags to point to the newest daily entry image.
5. **Comments Config (`assets/data/comments.json`)**: Initialize a zero count for the new entry's DOM ID (e.g., `"sep-28-26": 0`). _Note: Always manually append a trailing POSIX newline to this file when editing via Python scripts!_
