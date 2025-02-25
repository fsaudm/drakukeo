# v2 App: FastAPI + React

This project is a professional-level web application that combines a FastAPI backend with a React frontend. The app lets you:

- **Upload a main Excel file** ("archivo main.xlsx") that contains patient data.
- **Display a grid view** of the patient records once the file is uploaded.
- **Add new entries** using 5 input fields each for procedures, medications, and supplies.
- **Synchronize diagnostic fields** so that the diagnostic name and code update in tandem (each in its own box).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
  - [Start the FastAPI Backend](#start-the-fastapi-backend)
  - [Start the React Frontend](#start-the-react-frontend)
- [API Endpoints](#api-endpoints)
- [Additional Notes](#additional-notes)

## Overview

The v2 App consists of two components:

1. **FastAPI Backend (`main.py`):**
   - Loads and saves patient data from an Excel file.
   - Provides endpoints for:
     - Uploading the main file.
     - Retrieving grid data.
     - Autocomplete searches for patients, diagnostics, procedures, and medications.
     - Synchronizing diagnostic fields (by name or code).
     - Adding new entries (with 5 fields each for procedures, medications, and supplies).
   - Saves the Excel file using the same column names and applies colored fills based on patient and date.

2. **React Frontend (in the `frontend/` directory):**
   - Provides a user interface to:
     - Upload the main file.
     - View the grid data of patient records.
     - Enter new entries with separate fields for:
       - Patient name.
       - Diagnostic name and diagnostic code (which sync with each other).
       - Five rows for procedures, medications, and supplies (each with fields for name, code, and quantity).

## Prerequisites

### Backend
- Python 3.9+
- Required Python packages:
  - fastapi
  - uvicorn
  - pandas
  - openpyxl
  - pydantic
  - python-multipart

### Frontend
- Node.js (latest LTS recommended)
- Yarn (or npm; these instructions use Yarn)

## Installation

### Backend Setup

1. **Place your backend files** (including `main.py`, `maestro_procedimientos.xlsx`, `maestro_medicamentos.xlsx`, and `maestro_diagnosticos.xlsx`) in a folder (e.g., `backend/`).

2. **Create and activate a Python virtual environment (optional but recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install the required Python packages:**

   ```bash
   pip install fastapi uvicorn pandas openpyxl python-multipart
   ```

### Frontend Setup

1. **Install Node.js and Yarn:**
   - Download Node.js from [nodejs.org](https://nodejs.org/).
   - Install Yarn globally (if not already installed):

     ```bash
     npm install -g yarn
     ```

2. **Create a new React app:**

   ```bash
   yarn create react-app frontend
   ```

3. **Navigate to the React project folder:**

   ```bash
   cd frontend
   ```

4. **Install required dependencies:**

   ```bash
   yarn add axios react-select
   ```

5. **Replace the default files:**
   - Replace `src/App.js` with your custom React code.
   - Replace `src/App.css` with your custom CSS.
   - (Optional) Delete unused files like `logo.svg`.


6. **Build the React app for staticfrom FastAPI**

    ```bash
    yarn build
    ```


## Running the Application

### Start the FastAPI Backend

1. **Navigate to your backend folder** (where `main.py` is located).

2. **Start the server using uvicorn:**

   ```bash
   uvicorn main:app --reload
   ```

3. **Test the backend API:**  
   Open your browser and visit [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to see interactive API documentation.

### Start the React Frontend

1. **Navigate to the `frontend` folder:**

   ```bash
   cd frontend
   ```

2. **Start the development server:**

   ```bash
   yarn start
   ```

3. The React app should open automatically in your browser at [http://localhost:3000](http://localhost:3000).

## API Endpoints

- **POST** `/upload/`  
  Uploads the main Excel file and loads patient data.

- **GET** `/data/`  
  Returns all patient data for the grid view.

- **GET** `/sync/diagnostic/`  
  Synchronizes diagnostic fields (accepts query parameters `name` or `code`).

- **GET** `/search/patients/`  
  Searches for patients by name.

- **GET** `/search/diagnostics/`  
  Searches for diagnostics by name.

- **GET** `/search/procedures/`  
  Searches for procedures by name.

- **GET** `/search/medications/`  
  Searches for medications by name.

- **POST** `/add/`  
  Adds a new entry (with 5 fields each for procedures, medications, and supplies).

- **POST** `/save/`  
  Saves the current data to the Excel file with colored rows.

## Additional Notes

- **Diagnostic Sync:**  
  The `/sync/diagnostic/` endpoint allows you to provide either a diagnostic name or code; the endpoint returns both values so that the two input fields can sync automatically.

- **Grid View:**  
  The `/data/` endpoint provides the data for the grid view. The React frontend displays this in a table after a file upload.

- **Deployment:**  
  For local development, run the FastAPI backend and React frontend on your computer. For production, consider hosting the backend on a cloud service and deploying the React build on a service such as Vercel or Netlify.

Enjoy your v2 App!
