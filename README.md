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
| LLM Fine-Tuning Export (OpenAI ChatML, Gemini Supervised, Alpaca, HF JSONL) | ✅ Released |
| EdgeVision Computer Vision (Bounding boxes, YOLO .zip & COCO .json export) | ✅ Released |
| Dataset QA & Health Checks (Duplicates, missing values, class imbalance) | ✅ Released |
| Inter-Annotator Agreement (Cohen's Kappa & conflict resolution) | ✅ Released |
| Glossary & Localisation Studio (Approval workflows, terminology manager) | ✅ Released |
| Regulatory Audit Trail & SHA-256 Data Integrity | ✅ Released |
| Documented Air-Gap & Security Architecture (`security-architecture.html`) | ✅ Released |
| Named Entity Recognition (NER) inline highlighter | Planned |
| Audio / video annotation (timestamps, transcription) | Planned |

---

## 🚀 Deployment & GitHub Pages

EdgeLabel can be deployed to GitHub Pages via either of two supported configurations:

### Option A: GitHub Actions (Recommended)
This repository includes an automated workflow at `.github/workflows/deploy.yml`:
1. In your GitHub repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish the latest version without needing manual commits to `docs/`.

### Option B: Deploy from `/docs` folder
If you prefer branch-based deployment:
1. In GitHub repository **Settings** → **Pages**, select **Deploy from a branch**.
2. Choose branch: `main` (or `master`), folder: `/docs`.
3. Whenever you make changes locally, run:
   ```bash
   npm run build
   git add docs/
   git commit -m "Build static site into docs"
   git push origin main
   ```

### Option C: Push to `gh-pages` branch
You can also deploy directly using the gh-pages CLI script:
```bash
npm run deploy
```

---

## 🛠️ Quick setup (local development)

### Prerequisites
- Node.js v18+ (Node 22 recommended)
- npm

### Installation
```bash
git clone https://github.com/clueanalytics7/edgelabel.git
cd edgelabel
npm install
npm run dev        # Vite dev server at http://localhost:3000
npm run build      # Production build → docs/
```

---

## 📁 File structure

```
edgelabel/
├── .github/workflows/deploy.yml  # Automated GitHub Actions deployment
├── index.html                    # Landing page & suite switcher
├── annotation.html               # Text annotation & LLM export tool
├── image-annotation.html         # EdgeVision computer vision bounding boxes
├── translation.html              # Localization, terminology & approval studio
├── security-architecture.html    # Local processing & air-gap documentation
├── about.html
├── contact.html
├── guide.html
├── privacy.html
├── docs/                         # Production build folder for GitHub Pages
├── public/                       # Static assets & sample datasets
├── src/                          # React components & processing engines
├── tailwind.config.cjs
├── vite.config.js
└── package.json
```

---

## 🔒 Privacy & Security

EdgeLabel is built on a 100% local-first principle: your dataset files and image assets are read by your browser using the HTML5 [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API) and memory object URLs. They are never transmitted to external servers. Review the full interactive security model at `/security-architecture.html`.

---

## 📄 License

MIT © 2025 [ClueAnalytics](https://clueanalytics7.github.io/edgelabel/)
