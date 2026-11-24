# Sam Lewis portfolio

One-page portfolio. Live at https://samlewis.fyi/ (GitHub Pages).

## Editing

Go to **https://samlewis.fyi/admin/** and enter your password.

- Click any words on the page to change them. Click a picture to replace it.
- Hover a section for its toolbar: move, recolour, hide, duplicate, delete, settings.
- Drag sections in the left-hand list to reorder. "+ Add section" adds a new one.
- Click a project card to open and edit it. Add projects from the Projects tab.
- Changes save in your browser as you go. Nothing goes live until you press **Publish**,
  and then it takes about a minute.

The first time, the editor asks for a GitHub fine-grained token (this repository only,
Contents: read and write) and a password. The token is stored encrypted with that password
in `admin/auth.json`. If the token expires, delete `admin/auth.json` and set up again.

## Files

- `content.json`: all the words, projects and section order (the editor writes this)
- `index.html`, `site.css`, `site.js`: the site
- `admin/`: the editor
- `img/`, `video/`: media (new uploads go in `img/uploads/` and `video/uploads/`)
- `auk/`, `pinterest/`: standalone pitch pages, unchanged
