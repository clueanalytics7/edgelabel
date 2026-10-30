# EdgeLabel by Cueligence

[![Demo](https://img.shields.io/badge/Demo-Live-green)](https://clueanalytics7.github.io/edgelabel/)
[![Licence](https://img.shields.io/badge/Licence-MIT-blue)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20In--Browser-emerald)](#-zero-server-privacy-enclave)
[![PWA](https://img.shields.io/badge/PWA-Air--Gapped%20Offline-purple)](#-air-gapped-pwa-architecture)

> **EdgeLabel** is an enterprise-grade, privacy-first data annotation, localization, and dataset quality assurance platform developed by **Cueligence**. Executing 100% client-side inside your browser via WebAssembly and Web Workers, EdgeLabel guarantees that your sensitive clinical records, proprietary imagery, and confidential CSV datasets never leave your workstation.

🔗 **Live Platform:** [https://clueanalytics7.github.io/edgelabel/](https://clueanalytics7.github.io/edgelabel/)

---

## 📑 Table of Contents

1. [Product Overview & Dedicated Feature Suites](#-product-overview--dedicated-feature-suites)
2. [Dataset Quality Assurance & Trust Engine](#-dataset-quality-assurance--trust-engine)
3. [Guided Workflows & Advanced Tasks](#-guided-workflows--advanced-tasks)
   - [Workflow 1: Clinical Text Classification & Medical NER](#workflow-1-clinical-text-classification--medical-ner)
   - [Workflow 2: Dermatology, Wound Care & Skin Infection Annotation](#workflow-2-dermatology-wound-care--skin-infection-annotation)
   - [Workflow 3: Multilingual Localization & Terminology Studio](#workflow-3-multilingual-localization--terminology-studio)
   - [Workflow 4: Inter-Annotator Agreement (Cohen's Kappa) & Blinded Splits](#workflow-4-inter-annotator-agreement-cohens-kappa--blinded-splits)
4. [Zero-Server Privacy Enclave & Compliance](#-zero-server-privacy-enclave--compliance)
5. [Commercial Plans & Pricing Architecture](#-commercial-plans--pricing-architecture)
6. [Local Development & Deployment](#-local-development--deployment)
7. [Repository File Map](#-repository-file-map)
8. [Licence](#-licence)

---

## 🌟 Product Overview & Dedicated Feature Suites

EdgeLabel provides a unified tri-modal workspace designed to eliminate tool sprawl. Instead of configuring separate self-hosted databases and servers for NLP, Computer Vision, and Translation, teams access dedicated client-side studios through a coherent interface:

| Suite / Page | Primary Capabilities | Target Formats |
|---|---|---|
| **Text Annotation Studio**<br/>`annotation.html` | Tabular row classification, multi-class hotkey tagging (1–9), token-level Named Entity Recognition (NER), local regex heuristics pre-labelling, text augmentation. | CSV, JSON, SpaCy v3, CoNLL-2003 IOB2, Hugging Face, OpenAI ChatML, Alpaca |
| **EdgeVision Computer Vision**<br/>`image-annotation.html` | Bounding box annotation, clinical wound tissue enhancement (erythema, necrotic slough, edges), lesion surface area estimation, image data augmentation. | YOLO v8 (`.txt` + `yaml`), COCO (`.json`), Classification CSV |
| **EdgeTranslate Studio**<br/>`translation.html` | Row-by-row translation, Terminology & Glossary Manager, "Do Not Translate" (DNT) enforcement, three-stage approval review queues (Draft, Needs Review, Approved). | CSV (with bilingual appended columns), JSON terminology codebooks |
| **Security Architecture**<br/>`security-architecture.html` | Interactive technical explanation of local-first memory isolation, zero network egress proofs, Web Crypto SHA-256 non-repudiation, and air-gapped readiness. | Architecture documentation & audit proofs |
| **Commercial Pricing**<br/>`pricing.html` | Community free tier overview and Commercial Team Workspace with Year 1 Promotional Launch Rate. | Commercial licences & compliance packages |
| **Workspace Administration**<br/>`admin.html` | Passcode-gated console for Cueligence operators: cryptographic regulatory audit verifier, licence key generator, and inbound inquiry dispatch hub. | Administrative operations & audit certificates |

---

## 🛡️ Dataset Quality Assurance & Trust Engine

One of the central differentiators of EdgeLabel is its **Dataset Quality Assurance & Trust Engine**. Modern machine learning and regulatory audits require moving beyond basic manual tagging toward **measurable dataset integrity**.

EdgeLabel complements annotation by transforming raw or partially labelled tables into datasets that engineering teams, clinical leads, and auditors can trust, inspect, and verify.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EDGELABEL DETERMINISTIC QA PIPELINE                  │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│ 1. Duplication  │ 2. Completeness │ 3. Balance &     │ 4. Consistency  │
│    Detection    │    & Nulls      │    Entropy       │    & Contradict │
│ • Exact Hash    │ • Empty Cells   │ • Class counts   │ • Identical text│
│ • Fuzzy Whitesp.│ • Short tokens  │ • Shannon H      │   contrasting   │
│ • Cross-split   │ • Null embeds   │ • Gini impurity  │   labels        │
└────────┬────────┴────────┬────────┴────────┬─────────┴────────┬────────┘
         │                 │                 │                  │
         ▼                 ▼                 ▼                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ACTIVE REVIEW QUEUE & TRANSFORMATION LEDGER              │
│  • One-click review queue filtering for flagged/uncertain samples      │
│  • Pre-flight schema validation gate (string offsets & box limits)     │
│  • Exportable Markdown audit reports with explicit verification scope   │
└────────────────────────────────────────────────────────────────────────┘
```

### Potential Features & Capabilities

1. **Duplicate and Missing-Value Detection**
   - Scans text columns for exact duplicates and normalized whitespace/casing variations.
   - Quarantines duplicate rows to prevent train/test data leakage.
   - Detects null, whitespace-only, or truncated entries that would create corrupt embeddings during model training.

2. **Label-Distribution & Class-Imbalance Reports**
   - Automatically computes class frequencies, representation percentages, **Shannon Entropy ($H$)**, and **Gini Impurity**.
   - Issues warnings when majority classes exceed 75% of annotations or when critical minority classes fall below 3% (rare classes).

3. **Detection of Inconsistent & Contradictory Annotations**
   - Flags rows where identical or near-identical text has been assigned conflicting labels across different annotators or sessions.
   - Provides side-by-side conflict comparisons with direct links to jump to disputed rows in the workspace.

4. **Review Queues for Uncertain or Disputed Examples**
   - Allows operators to click **"Enter Review Queue"** from the QA modal to filter the workspace exclusively to flagged rows.
   - Enables rapid, focused adjudication without manually searching through thousands of records.

5. **Export Validation & Pre-Flight Schema Checks**
   - Validates that entity span character offsets (`start`, `end`) do not exceed string lengths, overlap illegally, or clip tokens.
   - Verifies bounding box coordinates satisfy $0 \le x, y$ and $x + w \le W$, $y + h \le H$.
   - Warns on unlabelled rows or schema rule violations before exporting.

6. **Reproducible Summaries of Dataset Changes (Change Ledger)**
   - Generates a chronological Markdown change ledger documenting raw ingested count, active rows, quarantined duplicates, and new ground-truth additions.

### ⚠️ Scope of Verification & Disclaimer of Non-Guarantee

> **Important Notice:** Every EdgeLabel Dataset Quality Report and Image QA Audit describes **only the structural and programmatic checks performed on the dataset**: exact/near-duplicate matching, missing value counts, label distribution balance, text length boundaries, entity character span limits, and annotation consistency.
>
> **This audit is an objective assessment of structural completeness and internal consistency. It must NOT be marketed, sold, or interpreted as a guarantee that a dataset is factually accurate, clinically correct, free from real-world statistical bias, or suitable for training any particular machine learning architecture.**

---

## 🚀 Guided Workflows & Advanced Tasks

---

### Workflow 1: Clinical Text Classification & Medical NER

**Objective:** Ingest emergency department triage notes, assign urgency classifications, highlight clinical entities (Medications, Conditions, Anatomical Sites), run deterministic QA checks, and export to SpaCy v3 and Hugging Face formats.

#### 1. Sample Clinical Dataset

Copy and save the following snippet as `clinical_triage_sample.csv`:

```csv
record_id,patient_age,chief_complaint,triage_note
REC-101,64,Chest tightness,"Patient reports severe retrosternal chest pain radiating to left jaw. Administered Aspirin 300mg orally. Urgent ECG requested."
REC-102,28,Skin infection,"Erythematous spreading lesion over right lower leg with localized warmth and purulent discharge. Prescribed Flucloxacillin 500mg QDS."
REC-103,72,Shortness of breath,"Chronic COPD exacerbation. Dyspnoea on minimal exertion. Oxygen saturation 89% on room air. Commenced Nebulised Salbutamol 5mg."
REC-104,45,Wound evaluation,"Post-operative abdominal laparotomy review. Minor wound dehiscence noted at lower suture margin with serosanguinous exudate. No systemic fever."
REC-105,64,Chest tightness,"Patient reports severe retrosternal chest pain radiating to left jaw. Administered Aspirin 300mg orally. Urgent ECG requested."
```

*(Note: Row `REC-105` is an intentional duplicate of `REC-101` to demonstrate automated deduplication).*

#### 2. Guided First Task: Step-by-Step

1. Open `annotation.html` in your browser.
2. Drag and drop `clinical_triage_sample.csv` onto the upload zone (or click **✨ Try Medical NER Sample**).
3. In **Settings**, choose `triage_note` as the column to annotate.
4. **Classification Mode:**
   - Use hotkeys **1** (Urgent), **2** (Standard), **3** (Routine) to classify each triage note.
5. **Switch to Entity / Spans Mode (NER):**
   - Click the **✨ Entity / Spans (NER)** toggle in the top bar.
   - Select text with your cursor:
     - Highlight `"retrosternal chest pain"` → Tag as **CONDITION** (Hotkey 2).
     - Highlight `"Aspirin 300mg"` → Tag as **MEDICATION** (Hotkey 1).
     - Highlight `"left jaw"` → Tag as **ANATOMY** (Hotkey 3).
6. **Run Quality Assurance Audit:**
   - Click **QA Audit** in the top bar.
   - Observe the **Duplicate Detection** finding flagging `REC-105` and `REC-101`.
   - Click **Auto-Deduplicate** to quarantine the redundant record.
   - Review the **Shannon Entropy** score and **Class Distribution**.
   - Click **Export Audit Report (.md)** to download the audit certificate.
7. **Export Training Data:**
   - Click **Export** → Select **SpaCy v3** or **Hugging Face JSONL**.

#### 3. Example Export: SpaCy v3 Entity Format

```json
[
  {
    "text": "Patient reports severe retrosternal chest pain radiating to left jaw. Administered Aspirin 300mg orally. Urgent ECG requested.",
    "entities": [
      { "start": 16, "end": 39, "label": "CONDITION" },
      { "start": 55, "end": 63, "label": "ANATOMY" },
      { "start": 78, "end": 91, "label": "MEDICATION" }
    ],
    "cats": {
      "Urgent": 1.0,
      "Standard": 0.0,
      "Routine": 0.0
    }
  }
]
```

---

### Workflow 2: Dermatology, Wound Care & Skin Infection Annotation

**Objective:** Annotate clinical cutaneous wound images (Diabetic Foot Ulcers, Purulent Bacterial Cellulitis, Surgical Dehiscence) with tissue-specific classes, optimize visual contrast for necrotic slough vs granulation, measure lesion surface area percentages, and export to YOLO v8 and COCO formats.

#### 1. Specialized Clinical Dermatology Taxonomy

EdgeVision includes a predefined, clinically validated wound assessment taxonomy:

- 🔴 **Erythema (Inflamed Margin):** Advancing perilesional flare or cellulitis border.
- 🟡 **Purulent Exudate (Pus):** Bacterial suppurative collection or active wound discharge.
- 🟤 **Necrotic Slough / Eschar:** Non-viable, devitalized yellow/brown/black tissue bed.
- 🌺 **Granulation Bed:** Viable, vascular, healthy pink/red healing tissue.
- 🟢 **Epithelial Edge:** Advancing skin margin re-epithelialisation.
- 🟣 **Cellulitic Induration:** Deep dermal inflammation plateau.
- 🔵 **Ulceration Dermis Breach:** Full or partial thickness epidermal loss.

#### 2. Guided First Task: Step-by-Step

1. Open `image-annotation.html` in your browser.
2. In the top navigation bar, click **🩺 Wound Samples** (or drag in your clinical JPG/PNG wound photographs).
3. The platform instantly loads three synthetic clinical wound cases:
   - **Case 1:** Diabetic Foot Ulcer (Wagner Grade 2) with central slough and periwound erythema.
   - **Case 2:** Acute Bacterial Cellulitis & Abscess with 10:30 AM margin demarcation pen tracking.
   - **Case 3:** Post-Laparotomy Surgical Dehiscence with fibrinous exudate.
4. **Activate Clinical Tissue Enhancer:**
   - Click **🔬 Wound & Tissue Enhancer** in the upper-left corner of the canvas.
   - Click **🔴 Erythema Focus** to boost saturation (175%) and highlight subtle vascular flares around infected tissue.
   - Click **🟡 Slough Contrast** to boost contrast (160%) and differentiate devitalized slough from bleeding granulation.
   - Click **🟣 Edge Inversion** to inspect advancing epithelial border migration.
5. **Draw & Refine Bounding Boxes:**
   - Select **Necrotic Slough** from the right sidebar.
   - Click and drag over the central wound core.
   - Inspect the **Floating Lesion Inspector**:
     - View exact pixel dimensions: `100 × 80 px`.
     - View surface area: `8,000 px²`.
     - View lesion area percentage: `1.7% field`.
6. **Execute Image QA Audit:**
   - Click **QA Audit** in the top controls.
   - The scanner checks every bounding box for clipping beyond image boundaries ($x < 0$, $x+w > W$), alerts on microscopic boxes (<15px), and outputs the class distribution matrix.
   - Click **Export QA Report (.md)**.
7. **Export Computer Vision Annotations:**
   - Click **YOLO (.zip)** to download YOLO-format `.txt` labels and `dataset.yaml`.
   - Click **COCO (.json)** to download standard COCO-compliant JSON format.

#### 3. Example Export: YOLO v8 Annotation (`001.txt`)

Normalized coordinates: `<class_id> <x_center> <y_center> <width> <height>`

```text
0 0.493750 0.541667 0.412500 0.433333
3 0.487500 0.533333 0.237500 0.250000
2 0.493750 0.533333 0.125000 0.133333
```

Associated `dataset.yaml`:

```yaml
names:
  0: Erythema (Inflamed Margin)
  1: Purulent Exudate (Pus)
  2: Necrotic Slough
  3: Granulation Bed
  4: Epithelial Edge
  5: Cellulitic Induration
  6: Ulceration Dermis Breach
nc: 7
train: ../train/images
val: ../val/images
```

---

### Workflow 3: Multilingual Localization & Terminology Studio

**Objective:** Translate medical device instructions and clinical questionnaires while enforcing **"Do Not Translate" (DNT)** protected terms and managing approval states across multiple review stages.

#### 1. Sample Localization Dataset

Save as `medical_localization_sample.csv`:

```csv
item_id,source_en,context,translation_status
DEV-01,"Clean the EdgeLabel Sensor Probe with 70% isopropyl alcohol before patient contact.","Medical device cleaning manual",Draft
DEV-02,"Do not autoclave the Cueligence Optical Transducer. Store at room temperature.","Operating room warnings",Draft
DEV-03,"Patient indicated moderate pain in the right shoulder joint during abduction.","Clinical trial evaluation",Needs Review
DEV-04,"Verify that the battery LED illuminates green prior to initiating data logging.","Field engineering guide",Approved
```

#### 2. Guided First Task: Step-by-Step

1. Open `translation.html` in your browser and upload the CSV.
2. Select `source_en` as the source column.
3. Open **Terminology & Glossary Manager**:
   - Add `"EdgeLabel Sensor Probe"` as **Do Not Translate (DNT)**.
   - Add `"Cueligence Optical Transducer"` as **Do Not Translate (DNT)**.
   - Add `"isopropyl alcohol"` with translation target `"alcool isopropylique"`.
4. As you type translations into row 1, protected DNT terms are highlighted in purple pills, warning against accidental alteration.
5. Assign review statuses (**Draft**, **Needs Review**, **Approved**) with one click.
6. Click **Export Translated CSV** to download the updated spreadsheet with the new `Translation` and `Review_Status` columns appended.

#### 3. Example Export: Bilingual Localization CSV (`medical_localization_sample_translated.csv`)

```csv
item_id,source_en,context,translation_status,translation,review_status
DEV-01,"Clean the EdgeLabel Sensor Probe with 70% isopropyl alcohol before patient contact.","Medical device cleaning manual",Draft,"Nettoyer le capteur EdgeLabel Sensor Probe avec de l'alcool isopropylique à 70% avant tout contact avec le patient.",Approved
DEV-02,"Do not autoclave the Cueligence Optical Transducer. Store at room temperature.","Operating room warnings",Draft,"Ne pas passer à l'autoclave le Cueligence Optical Transducer. Conserver à température ambiante.",Approved
DEV-03,"Patient indicated moderate pain in the right shoulder joint during abduction.","Clinical trial evaluation",Needs Review,"Le patient a signalé une douleur modérée dans l'articulation de l'épaule droite pendant l'abduction.",Approved
DEV-04,"Verify that the battery LED illuminates green prior to initiating data logging.","Field engineering guide",Approved,"Vérifier que la diode DEL de la batterie s'allume en vert avant de démarrer l'enregistrement des données.",Approved
```

---

### Workflow 4: Inter-Annotator Agreement (Cohen's Kappa) & Blinded Splits

**Objective:** Conduct a scientific multi-rater validation study to measure inter-annotator concordance ($\kappa$) for regulatory submissions (FDA 21 CFR Part 11, EMA).

#### 1. Blinded Batch Partitioning

1. From `annotation.html`, open **Blinded Split**.
2. Select your master unlabelled dataset (e.g., 500 clinical notes).
3. Set the **Control Overlap Ratio** to `20%` and specify `3 Annotators`.
4. EdgeLabel partitions the dataset into 3 randomized batches where each annotator receives their unique partition plus the identical 20% control overlap.
5. Export the blinded files: `batch_annotator_1.csv`, `batch_annotator_2.csv`, `batch_annotator_3.csv`.

#### 2. Adjudication & Cohen's Kappa Matrix

1. Once annotators return their completed batches, open **Agreement Resolver**.
2. Upload the completed batches.
3. EdgeLabel matches identical row IDs in the control set and calculates **Cohen's Kappa ($\kappa$)**:
   - $\kappa > 0.81$: Almost Perfect Agreement.
   - $0.61 \le \kappa \le 0.80$: Substantial Agreement.
   - $\kappa < 0.60$: Moderate/Fair Agreement (flags for senior adjudication).
4. Review the conflict matrix and click **Apply Adjudicated Master** to resolve tie-breakers.

#### 3. Example Export: Cohen's Kappa Concordance & Adjudication Report (`agreement_audit_report.json`)

```json
{
  "audit_type": "Inter-Annotator Agreement & Adjudication Protocol",
  "dataset": "clinical_triage_master_v2.csv",
  "raters": ["Annotator_Dr_Evans", "Annotator_RN_Patel"],
  "overlap_sample_size": 100,
  "metrics": {
    "observed_agreement_Po": 0.920,
    "chance_agreement_Pe": 0.385,
    "cohens_kappa": 0.870,
    "interpretation": "Almost Perfect Agreement (Landis & Koch, 1977)"
  },
  "confusion_matrix": {
    "Normal": { "Normal": 42, "Urgent": 2, "Critical": 0 },
    "Urgent": { "Normal": 3, "Urgent": 33, "Critical": 1 },
    "Critical": { "Normal": 0, "Urgent": 2, "Critical": 17 }
  },
  "adjudication_summary": {
    "unanimous_rows": 92,
    "disputed_rows": 8,
    "adjudicated_by": "Lead Clinical Adjudicator",
    "adjudication_timestamp": "2026-10-30T10:15:00Z",
    "consensus_status": "Final Ground Truth Certified"
  }
}
```

---

## 🔒 Zero-Server Privacy Enclave & Compliance

Traditional cloud annotation tools tend to transmit your raw data to remote cloud clusters, triggering lengthy enterprise Information Security (InfoSec) assessments, Data Protection Impact Assessments (DPIA), and Business Associate Agreements (BAA).

EdgeLabel operates on an **in-browser execution model**:

```
[ Local File / Image ]
        │
        ▼ (HTML5 File API & FileReader)
[ In-Browser Sandbox: WebAssembly / Web Workers / IndexedDB ]
        │
        ├── Text parsing & Token NER
        ├── High-contrast Canvas rendering
        └── Deterministic QA scanning & SHA-256 verification
        │
        ▼ (Browser Memory Blob)
[ Direct Download to Local Storage ]
        ❌ ZERO NETWORK EGRESS TO REMOTE SERVERS ❌
```

### Architectural Safeguards

- **Memory Isolation:** Processing occurs entirely inside client RAM. Closing the tab purges all unpersisted session state.
- **Offline Progressive Web App (PWA):** Precached service workers allow the platform to be loaded, disconnected from the internet, and used completely air-gapped in secure research cleanrooms or hospital LANs.
- **Cryptographic Audit Verifier (SHA-256):** Actions are logged in a tamper-evident, monotonically timestamped JSON ledger that can be verified in `/admin.html` without external database logging.
- **GDPR Article 28 & HIPAA Security Rule:** Because Cueligence never receives, hosts, or transmits client data, no third-party processor liability is created.

---

## 💰 Commercial Plans & Pricing Architecture

EdgeLabel offers transparent, predictable pricing with zero per-row cloud compute taxes:

| Plan | Price | Target Audience | Key Capabilities |
|---|---|---|---|
| **Community Tier** | **£0** (Forever Free) | Individual researchers, students, open-source contributors | Unlimited in-browser text labelling, image bounding boxes, translation, local NER, and QA scanning. |
| **Team Workspace** | **£199** / first year<br/>*(Standard: £399/yr)* | Small businesses, clinical research units, AI agencies | Up to 10 seats, blinded assignment splitter, shared taxonomy codebooks, Cohen's Kappa adjudication, QA audit reports, and priority 24h SLA. |
| **Enterprise Air-Gapped** | Custom Quote | Hospitals, pharmaceutical enterprises, defence enclaves | Self-hosted on-premises Docker containers, custom heuristic regex engines, signed HIPAA BAA agreements, SSO/SAML integration. |
| **Managed Labelling** | Per-Project Quote | Teams requiring vetted annotators | Cueligence's domain specialists label and adjudicate datasets with guaranteed inter-annotator concordance ($\kappa > 0.85$). |

---

## 🛠️ Local Development & Deployment

### Prerequisites

- Node.js v18+ (Node.js 22 LTS recommended)
- npm or bun

### Installation & Local Dev Server

```bash
# Clone the repository
git clone https://github.com/clueanalytics7/edgelabel.git
cd edgelabel

# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
# Build production bundle into /docs (for GitHub Pages hosting)
npm run build
```

### GitHub Pages Deployment

The repository is preconfigured for automatic GitHub Pages deployment via **GitHub Actions** (`.github/workflows/deploy.yml`) on every push to `main`. Alternatively, point GitHub Pages to the `/docs` folder in repository settings.

---

## 📁 Repository File Map

```
edgelabel/
├── index.html                    # Platform landing page & suite switcher
├── annotation.html               # Text annotation, NER span highlighter & QA suite
├── image-annotation.html         # EdgeVision image annotation & clinical wound studio
├── translation.html              # EdgeTranslate multilingual localization studio
├── security-architecture.html    # Interactive air-gap & privacy architecture model
├── pricing.html                  # Community tier & Commercial Team Workspace pricing
├── admin.html                    # Passcode-gated Admin Console & regulatory verifier
├── about.html                    # Cueligence company background & mission
├── contact.html                  # Inbound commercial sales inquiry & lead form
├── guide.html                    # Comprehensive user guide & keyboard shortcuts
├── privacy.html                  # Privacy policy & data sovereignty documentation
├── docs/                         # Production static build for GitHub Pages
├── public/                       # Favicons, Web App Manifest & static assets
├── src/
│   ├── annotation/               # Text annotation components & state
│   ├── image-annotation/         # Canvas overlay, clinical filters, QA modal, YOLO/COCO exporters
│   │   ├── Canvas.jsx            # Interactive SVG canvas with clinical tissue enhancement filters
│   │   ├── ImageQaModal.jsx      # Bounding box boundary & clipping audit engine
│   │   ├── cvExporters.js        # YOLO v8 zip & COCO json generators
│   │   └── sampleData.js         # Synthetic clinical wound & general CV datasets
│   ├── shared/                   # Shared enterprise utilities
│   │   ├── DatasetQualityScanner.js # Duplicate detection, Shannon entropy & QA reports
│   │   ├── DatasetQualityModal.jsx  # Interactive QA audit dialog & review queue launcher
│   │   ├── AgreementResolver.jsx    # Cohen's Kappa calculation & conflict adjudication
│   │   ├── BlindedAssignmentModal.jsx # Multi-rater double-blind partition generator
│   │   ├── NERAnnotator.jsx         # Character offset span highlighter
│   │   ├── heuristicEngine.js       # Regex heuristic rule evaluation engine
│   │   ├── exportFormats.js         # ML fine-tuning format adapters (SpaCy, ChatML, Alpaca)
│   │   └── theme.js                 # Dark / light / system theme state
│   ├── translation/              # Translation studio & glossary managers
│   └── input.css                 # Tailwind CSS directives
├── vite.config.js                # Multi-page Vite configuration & PWA manifest
├── tailwind.config.cjs           # Tailwind CSS theme configuration
└── package.json                  # Dependencies & scripts
```

---

## 📄 Licence

MIT © 2025 [Cueligence](https://clueanalytics7.github.io/edgelabel/). Built with pride for privacy-first research and data engineering teams.
