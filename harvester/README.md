# Courses Aggregator (ETL / Connectors)

## Prerequisites

- Node.js (project runs in ESM mode)
- A running MongoDB instance !!!

## Setup

0. Install MongoDb v8.2.3:
(https://www.mongodb.com/try/download/community)

Fill Compass correctly
In the URI box in Compass, type exactly:

mongodb://localhost:27017

Then click Save & Connect.

If it connects without error and shows you a list of databases, MongoDB server is running correctly.

If it fails, it means the MongoDB Windows service is not running; start it from Services or reinstall MongoDB Community Server.


1. Install dependencies:
   - `npm install`

2. Create a `.env` file in the project root:

   - `MONGO_URI=mongodb://localhost:27017`

## Run

### Full import (default)

- `npm start`

### Partial update

In PowerShell:

- `$env:IMPORT_MODE="partial"; npm start`

### Choose which sources to run

`IMPORT_SOURCES` is a comma-separated list:

- `$env:IMPORT_SOURCES="kaggle"; npm start`
- `$env:IMPORT_SOURCES="kaggle2"; npm start`
- `$env:IMPORT_SOURCES="kaggle,kaggle2"; npm start`

### Sources
(https://www.kaggle.com/datasets/kararhaitham/courses?resource=download),
([)](https://www.kaggle.com/datasets/nomanturag/online-course-datasetedx-udacity-coursera/data)

## Data sources in this repo

- Kaggle combined JSON: `src/harvesters/data/kaggle/combined_dataset.json`
- Kaggle2 CSV dataset: `src/harvesters/data/kaggle2/final_cleaned_dataset.csv`
