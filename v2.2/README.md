# v2.2 App: FastAPI + React (Development Build & Deployment)

This project is a professional-level web application that combines a FastAPI backend with a React frontend. In this repository, you’ll find the development version (v2.2) used for testing and feature development. The official production deployment is maintained in the **iess-app** directory.

The app lets you:

- **Upload a main Excel file** ("archivo main.xlsx") that contains patient data.
- **Display a grid view** of the patient records once the file is uploaded.
- **Add new entries** using multiple input fields for procedures, medications, and supplies.
- **Synchronize diagnostic fields** so that the diagnostic name and code update in tandem (each in its own input).

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application Locally](#running-the-application-locally)
  - [Starting the FastAPI Backend](#starting-the-fastapi-backend)
  - [Starting the React Frontend](#starting-the-react-frontend)
- [API Endpoints](#api-endpoints)
- [Deployment on Render](#deployment-on-render)
- [Additional Notes](#additional-notes)

---

## Overview

The v2 App consists of two components:

1. **FastAPI Backend (**``**)**

   - Loads and saves patient data from an Excel file.
   - Provides endpoints for:
     - Uploading the main file.
     - Retrieving grid data.
     - Autocomplete searches for patients, diagnostics, procedures, and medications.
     - Synchronizing diagnostic fields (by name or code).
     - Adding new entries.
   - Saves the Excel file using the same column names and applies colored fills based on patient and date.

2. **React Frontend (in the **``** directory)**

   - Provides a user interface to:
     - Upload the main file.
     - View the grid data of patient records.
     - Enter new entries with separate fields for:
       - Patient name.
       - Diagnostic name and diagnostic code (which sync with each other).
       - Multiple rows for procedures, medications, and supplies.
   - **Note:** Large dropdown lists (e.g., diagnostics with 19k items) are now loaded asynchronously via server‑side search for better performance.

---

## Prerequisites

### Backend

- Python 3.9+ (we recommend using a virtual environment)
- Required Python packages (see [requirements.txt](requirements.txt)):
  - fastapi==0.115.8
  - uvicorn==0.34.0
  - pandas==2.2.3
  - openpyxl==3.1.5
  - pydantic==2.10.6
  - python-multipart==0.0.20

### Frontend

- Node.js (latest LTS recommended)
- Yarn (or npm; these instructions use Yarn)

---

## Installation

### Backend Setup

1. **Clone the repository** and navigate to the project directory.

2. **Create and activate a Python virtual environment (optional but recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install the required Python packages:**

   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. **Navigate to the **``** directory:**

   ```bash
   cd frontend
   ```

2. **Install required dependencies:**

   ```bash
   yarn install
   ```

3. **Build the React app for static serving by FastAPI:**

   ```bash
   yarn build
   ```

---

## Running the Application Locally

### Starting the FastAPI Backend

1. **Navigate to your backend folder** (where `main.py` is located).

2. **Start the server using Uvicorn:**

   ```bash
   uvicorn main:app --reload
   ```

3. **Test the backend API:**\
   Open your browser and visit [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for interactive API documentation.

### Starting the React Frontend (Development Mode)

1. **Navigate to the **``** folder:**

   ```bash
   cd frontend
   ```

2. **Start the development server:**

   ```bash
   yarn start
   ```

3. The React app should automatically open in your browser at [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

- **POST** `/upload/`\
  Uploads the main Excel file and loads patient data.

- **GET** `/data/`\
  Returns all patient data for the grid view.

- **GET** `/sync/diagnostic/`\
  Synchronizes diagnostic fields (accepts query parameters `name` or `code`).

- **GET** `/search/patients/`\
  Searches for patients by name.

- **GET** `/search/diagnostics/`\
  Searches for diagnostics by name (returns up to 50 matches).

- **GET** `/search/diagnostics/code/`\
  Searches for diagnostics by code (returns up to 50 matches).

- **GET** `/search/procedures/`\
  Searches for procedures by name (returns up to 50 matches).

- **GET** `/search/medications/`\
  Searches for medications by a concatenated string (returns up to 50 matches).

- **POST** `/add/`\
  Adds a new entry (with multiple rows for procedures, medications, and supplies).

- **POST** `/delete/`\
  Deletes specified rows from the data.

- **POST** `/save/`\
  Saves the current data to the Excel file with colored rows.

---

## Deployment on Render

To deploy your app on [Render](https://render.com), follow these steps:

1. **Create a new Web Service** in your Render dashboard.
2. **Connect your GitHub repository**.
3. **Configure the Build Command:**
   ```bash
   pip install -r requirements.txt && cd frontend && yarn install && yarn build
   ```
4. **Configure the Start Command:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. **Deploy!**\
   Render will build and deploy your app. Check logs for any errors.

---

## Additional Notes

- **Asynchronous Search:** Large lists are now server-searched for better performance.
- **Floating Delete Button:** The delete button in the grid view remains visible.
- **Grid Coloring & Data Updates:** The backend applies rotating fill colors to the Excel output based on patient and date groupings.

Enjoy the v2.2 App!