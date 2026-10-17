# Supported Tags & Taxonomy Reference

This document tracks all supported tags and taxonomy rules for entries in `index.md`, routed and filtered client-side by [`assets/js/tag-router.js`](assets/js/tag-router.js).

_(See also: [PROMPTS.md](PROMPTS.md) for multi-prompt tabbing and prompt formatting rules.)_

---

## 1. Tagging Architecture & Rules

Every `<article class="post-entry">` in `index.md` requires:

1. A comma-separated `data-tags` attribute on the `<article>` element containing **all** tags applied to that entry.
2. Matching `<span class="tag ...">` pills inside `.post-tags-container` categorized into three visual tiers:
   - **1 Mandatory Topic** (`class="tag tag-topic"`)
   - **1 Mandatory Setting** (`class="tag tag-setting"`)
   - **1 or more Optional Styles / Modifiers** (`class="tag tag-style"`)

```html
<article class="post-entry" data-tags="literature, sci-fi, horror, cinematic">
  <h2 id="oct-15-26" ...>
    ...
    <div
      class="post-tags-container"
      style="display: flex; gap: 8px; flex-wrap: wrap; margin: 0; justify-content: flex-start;"
    >
      <span class="tag tag-topic" data-tag="literature">literature</span>
      <span class="tag tag-setting" data-tag="sci-fi">sci-fi</span>
      <span class="tag tag-style" data-tag="horror">horror</span>
      <span class="tag tag-style" data-tag="cinematic">cinematic</span>
    </div>
  </h2>
</article>
```

---

## 2. Topic Tags (`tag-topic`)

Every entry must include **one** primary topic tag:

| Tag (`data-tag`)   | Description / Typical Use                                     |
| :----------------- | :------------------------------------------------------------ |
| `animals`          | Wildlife, prehistoric creatures, and animal observance days   |
| `architecture`     | Fortifications, buildings, interiors, and structural scenes   |
| `character-design` | Character portraits, sprite sheets, and figure concepts       |
| `design`           | Rings, accessories, landscapes, and object/environment design |
| `folklore`         | Traditional myths, masks, and cultural legends                |
| `food-drink`       | Culinary scenes, beverages, and food assembly                 |
| `games`            | Tabletop, RPG, video game, and pixel-art game scenes          |
| `literature`       | Adaptations of novels, short stories, poems, and stage plays  |
| `meme`             | Humor and internet/pop-culture meme entries                   |
| `nature`           | Weather, landscapes, and botanical/natural phenomena          |
| `pop-culture`      | Television, film, and iconic media moments                    |
| `sports`           | Athletic poses and sporting events                            |
| `technology`       | Robotics, sci-fi hardware, and mechanical creations           |

---

## 3. Setting Tags (`tag-setting`)

Every entry must include **one** primary setting tag:

### Active Settings in `index.md`

- `contemporary`
- `fantasy`
- `historical`
- `middle-earth`
- `post-apocalyptic`
- `prehistoric`
- `sci-fi`
- `southern-gothic`
- `victorian`

### Additional Planned / Reserved Settings

- `cyberpunk`
- `dystopian`
- `mythological`
- `steampunk`
- `surreal`

---

## 4. Style & Modifier Tags (`tag-style`)

Entries can include **one or more** style, medium, artist, or technical modifier tags:

### Visual & Medium Styles

- `b-film`
- `blueprint` _(reserved)_
- `cinematic`
- `comic-art` _(reserved)_
- `concept-art`
- `dot-work`
- `double-exposure`
- `ethereal`
- `gothic`
- `graphic-novel`
- `horror`
- `illustration`
- `infographic`
- `journalistic`
- `macabre`
- `mask-art`
- `noir`
- `pixel-art`
- `realistic`
- `sand-art`
- `split-tone`
- `sprite-sheet`
- `still-life`
- `table-top`
- `webcomic`

### Artist & Homage Styles

- `APY`
- `canty`
- `dk-sweet`
- `g-moses`
- `lee-howe`
- `van-gogh`

### Sub-Themes, Regions & Technical Modifiers

- `dinosaurs`
- `insects`
- `lotro`
- `morocco`
- `multi-step` _(enables automatic base-prompt cloning across tabs in [`assets/js/collapse.js`](assets/js/collapse.js))_
- `reptiles`
- `scotland`
- `sri-lanka`

---

**Last Updated:** October 16, 2026
