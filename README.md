#  Open Courses Aggregator

> Οριζόντιος συγκεντρωτής για MOOCs που συλλέγει δεδομένα μαθημάτων από πολλαπλά αποθετήρια, τα αποθηκεύει σε ενιαία βάση δεδομένων και παρέχει React frontend για αναζήτηση, φιλτράρισμα και εξερεύνηση.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Apache Spark](https://img.shields.io/badge/Apache%20Spark-3.x-E25A1C?logo=apachespark)](https://spark.apache.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb)](https://www.mongodb.com/)

## Επισκόπηση

Το **Open Courses Aggregator** είναι μια ολοκληρωμένη πλατφόρμα που συγκεντρώνει και οργανώνει δεδομένα από Massive Open Online Courses (MOOCs). Χρησιμοποιεί Apache Spark για επεξεργασία δεδομένων μεγάλης κλίμακας, παρέχει προτάσεις μαθημάτων μέσω του Spark ML, και προσφέρει ένα σύγχρονο React interface για την εξερεύνηση χιλιάδων μαθημάτων.

### Βασικά Χαρακτηριστικά

- **Έξυπνη Αναζήτηση**: Αναζήτηση μαθημάτων με προηγμένα φίλτρα (θεματική ενότητα, επίπεδο δυσκολίας, γλώσσα, κλπ.)
- **Συστήματα Συστάσεων**: Προτάσεις μαθημάτων βασισμένες σε Spark MLlib
- **Ομαδοποίηση Μαθημάτων**: Clustering με LDA για ομοιότητα περιεχομένου
- **Επεξεργασία Μεγάλης Κλίμακας**: Apache Spark για γρήγορη επεξεργασία χιλιάδων μαθημάτων
- **Μοντέρνο UI**: React frontend με responsive design
- **Αυτόματη Συλλογή**: Harvester για περιοδική συλλογή δεδομένων από πολλαπλές πηγές
- **Ενιαία Αποθήκευση**: MongoDB για κεντρική διαχείριση δεδομένων

## Αρχιτεκτονική
```
Open-Courses-Aggregator/
├── Backend/                    # Node.js REST API Server
│   ├── package.json
│   └── src/
│       ├── app.js                 # Express application setup
│       ├── server.js              # Server entry point
│       ├── controllers/           # Business logic handlers
│       ├── routes/                # API route definitions
│       └── services/              # Database & external services
│
├── frontend/                   # React + Vite Application
│   ├── package.json
│   ├── vite.config.js             # Vite configuration
│   ├── index.html                 # Entry HTML
│   ├── public/                    # Static assets
│   ├── scripts/                   # Build & deployment scripts
│   └── src/
│       ├── App.jsx                # Main React component
│       ├── main.jsx               # React entry point
│       ├── auth.js                # Authentication logic
│       ├── api/                   # API client services
│       ├── assets/                # Images, fonts, icons
│       ├── components/            # Reusable React components
│       ├── hooks/                 # Custom React hooks
│       ├── pages/                 # Page-level components
│       └── utils/                 # Helper functions
│
├── SparkML/                    # Apache Spark Machine Learning
│   ├── config.py                  # Spark & MongoDB configuration
│   ├── featureExtraction.py       # TF-IDF & feature engineering
│   ├── courseClusters.py          # LDA clustering algorithm
│   ├── coursesSimilarity.py       # Cosine similarity calculations
│   ├── test.py                    # ML pipeline testing
│   └── cs                         # Trained model / vector space
│
├── harvester/                  # Data Collection Service (Node.js)
│   ├── package.json
│   ├── index.js                   # Main harvester orchestrator
│   ├── config/                    # Harvester configurations
│   ├── scripts/                   # Automation scripts
│   └── src/                       # Scraper implementations
│
├── 📄 FRONTEND_ENHANCEMENTS.md    # Frontend feature documentation
├── 📄 TESTING_GUIDE.md            # Testing guidelines & instructions
├── 📄 LICENSE                     # MIT License
└── 📄 README.md                   # Project documentation
```




## Εγκατάσταση

### Προαπαιτούμενα

- **Node.js** >= 18.x
- **Python** >= 3.9
- **Apache Spark** >= 3.x
- **MongoDB** >= 6.x
- **npm** ή **yarn**


