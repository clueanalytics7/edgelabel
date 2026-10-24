# EdgeLabel

[![Demo](https://img.shields.io/badge/Demo-Live-green)](https://clueanalytics7.github.io/edgelabel/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

A **browser-based, privacy-first platform** for annotating and translating CSV datasets. Everything runs locally in your browser — your data never leaves your device.

🔗 **Live Demo:** [https://clueanalytics7.github.io/edgelabel/](https://clueanalytics7.github.io/edgelabel/)

---

## ✅ What EdgeLabel does today

### Data Annotation (`annotation.html`)
- Upload any CSV file — drag and drop or file picker
- Select which column to annotate from a settings panel
- Assign labels to each row with one click or keyboard shortcut (keys 1–9)
- Customisable label sets — add or remove labels at any time
- Navigate rows with arrow keys (← →)
- Undo / redo (Ctrl+Z / Ctrl+Y)
- Optional per-row comment field
- Progress bar showing annotated vs total rows
- Export annotated results as **CSV** or **JSON**
- Save and reload sessions across page refreshes (localStorage)
- Autosave every 5 seconds
- Light / dark / system theme

### Data Translation (`translation.html`)
- Upload a CSV and manually enter translations row by row
- Select which column to translate from a settings panel
- Add optional comments per row
- Undo / redo support
- Export the original CSV with a new `Translation` column appended
- Save and reload sessions

### Privacy
- 100% local-first: no data is uploaded to any server
- Google Analytics is **opt-in only** — never loaded until you accept the consent banner
- Declining analytics keeps the product fully functional with zero tracking

---

## 🗺️ Roadmap — what's coming

These features are planned but **not yet implemented**. We will update this section as work progresses.

| Feature | Status |
|---|---|
| Image annotation (bounding boxes, polygons, keypoints) | Planned |
| Audio / video annotation (timestamps, transcription) | Planned |
| Named Entity Recognition (NER) annotation | Planned |
| Multi-label support (assign more than one label per row) | Planned |
| JSONL export (for LLM fine-tuning workflows) | Planned |
| COCO / Pascal VOC export formats | Planned |
| Team collaboration / shared projects | Planned |
| Role-based access (admin, annotator) | Planned |
| Cloud storage integration (S3, GCP) | Planned |
| REST API for automation | Planned |
| Automated / AI-assisted labelling suggestions | Planned |

---

## 🚀 Quick setup (local development)

### Prerequisites
- Node.js v18+
- npm

### Installation
```bash
git clone https://github.com/clueanalytics7/edgelabel.git
cd edgelabel
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run deploy     # Push dist/ to GitHub Pages
```

---

## 📁 File structure

```
edgelabel/
├── index.html          # Landing page
├── annotation.html     # Annotation tool
├── translation.html    # Translation tool
├── about.html
├── contact.html
├── guide.html
├── privacy.html
├── favicon.svg
├── public/images/
├── src/input.css       # Tailwind source
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🔒 Privacy & analytics

EdgeLabel is built on a local-first principle: your dataset files are read by your browser using the [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API) and never transmitted anywhere.

Optional Google Analytics (anonymised usage statistics) is available. It is disabled by default and only activated if you explicitly click **Accept** on the consent banner. You can change your preference at any time by clearing your browser's localStorage.

---

## 📄 License

MIT © 2025 [ClueAnalytics](https://clue-analytics.web.app/)
