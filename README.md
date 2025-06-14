# Data Annotation Platform

[![Demo](https://img.shields.io/badge/Demo-Live-green)](https://clueanalytics7.github.io/data-annotation/) 
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

A **web-based platform** for annotating CSV data with a mobile-friendly interface, theme toggle, and privacy notice. 


🔗 **Live Demo:** [https://clueanalytics7.github.io/data-annotation/](https://clueanalytics7.github.io/data-annotation/) 

---

## ✨ Key Features  

### **Multi-Data Support**  
- 🖼️ Images (PNG, JPG, etc.) 
- 📝 Text (NER, classification) 
- 🔊 Audio/video (timestamps, transcription) 

### **Flexible Annotation**  
- 🟦 Bounding boxes, polygons, keypoints 
- 🏷️ Customisable labelling workflows 
- ⚡ Keyboard shortcuts for speed 

### **Collaboration**  
- 👥 Team-based annotation projects 
- 🔐 Role-based access (admin, annotator) 
- 📊 Progress tracking dashboard 

### **Export & Integration**  
- 📤 Formats: JSON, COCO, CSV, Pascal VOC  
- ☁️ Direct upload to AWS S3/GCP 
- 🔌 API for automation 

---

## 🚀 Quick Setup  

### Prerequisites  
- Node.js v16+  
- npm/yarn  

### Installation  
```bash
git clone https://github.com/clueanalytics7/data-annotation.git
cd data-annotation-tool
npm install
npm start  # Dev server: http://localhost:3000
