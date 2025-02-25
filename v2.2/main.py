import os
import sys
import json
import math
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openpyxl import load_workbook
from openpyxl.styles import PatternFill
from io import BytesIO
from functools import lru_cache
from fastapi.staticfiles import StaticFiles

# Initialize FastAPI app
app = FastAPI()

# ========================
# 1. Configure CORS First
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://f881-67-173-101-35.ngrok-free.app",  # Your ngrok URL
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ========================
# 2. Define All API Routes
# ========================
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# Load Maestro Files
try:
    proc_df = pd.read_excel(resource_path("maestro_procedimientos.xlsx"))
    med_df = pd.read_excel(resource_path("maestro_medicamentos.xlsx"))
    diag_df = pd.read_excel(resource_path("maestro_diagnosticos.xlsx"))
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error loading maestro files: {e}")

med_df["concat"] = med_df["DESCRIPCIÓN"].astype(str) + " " + med_df["PRESENTACION"].astype(str)

# Global variables and required columns
DATA_FILE = "data.xlsx"
REQUIRED_COLUMNS = [
    'CÓDIGO DEPENDENCIA\n(ESPECIALIDAD)\n',
    'PLANILLA',
    'FECHA ANTENCION',
    'TIPO DE BENEFICIARIO',
    'CEDULA',
    'NOMBRE DE BENEFICIARIO',
    'SEXO-GENERO',
    'FECHA DE NACIMIENTO BENEFICIARIO',
    'EDAD BENEFICIARIO',
    'TIPO DE SERVICIO/ATENCION',
    'CODIGO',
    'DESCRIPCIÓN',
    'OBSERVACIONES',
    'DIAGNOSTICO PRINCIPAL CIE-10',
    'DIAGNSITICO SECUNDARIO 1',
    'DIAGNSITICO SECUNDARIO 2',
    'CANTIDAD',
    'VALOR UNITARIO',
    'DURACION CONSULTA',
    'PARENTESCO',
    'IDENTIFICACION AFILIADO',
    'NOMBRE AFIALIADO',
    'CODIGO DE DERIVACION',
    'NUMERO SECUNCIAL DERIVACION',
    'CONTINGENCIA CUBIERTA',
    'DIAGNOSTICO PRESUNTIVO O DIFINITIVO',
    'TIEMPO ANESTESIA',
    'DIAGNSITICO SECUNDARIO 3',
    'DIAGNSITICO SECUNDARIO 4',
    'DIAGNSITICO SECUNDARIO 5',
    'PORCENTAJE IVA',
    'VALOR IVA',
    'VALOR TOTAL',
    'GASTOS DE GESTIÓN (VALOR\nUNITARIO) / MODIFICADORES NO\nGEOGRÁFICOS (VALOR UNITARIO)',
    'FECHA DE INGRESO',
    'FECHA DE EGRESO',
    'MOTIVO DE EGRESO',
    'COBERTURA COMPARTIDA\n',
    'TIPO DE COBERTURA\n',
    'DISCAPACIDAD CERTIFICADA\n',
    'TIPO DE PRESTACIÓN\n',
    'TIPO DE MÉDICO',
    'FECHA AUTORIZADA PARA INICIO DE ATENCIÓN \n',
    'OBSERVACIONES\n',
    'MARCA FINAL (SIEMPRE F)'
]

if os.path.exists(DATA_FILE):
    df = pd.read_excel(DATA_FILE)
    df.columns = df.columns.str.strip()
    if len(df.columns) != len(REQUIRED_COLUMNS):
        raise HTTPException(
            status_code=500,
            detail=f"Data file missing columns (by index): expected {len(REQUIRED_COLUMNS)} but got {len(df.columns)}"
        )
    else:
        df.columns = REQUIRED_COLUMNS
else:
    df = pd.DataFrame(columns=REQUIRED_COLUMNS)

# --------------------------
# Grid columns (for frontend display)
# --------------------------
grid_columns = [
    'CÓDIGO DEPENDENCIA (ESPECIALIDAD)',  # Removed \n
    'FECHA ANTENCION',
    'CEDULA',
    'NOMBRE DE BENEFICIARIO',
    'CODIGO',
    'DESCRIPCIÓN',
    'OBSERVACIONES',
    'DIAGNOSTICO PRINCIPAL CIE-10',
    'CANTIDAD',
    'DIAGNOSTICO PRESUNTIVO O DIFINITIVO',
    'OBSERVACIONES'  # Removed trailing \n
]

# --------------------------
# PYDANTIC Models
# --------------------------
class EntryItem(BaseModel):
    name: str = ""
    code: str = ""
    quantity: int = 0

class NewEntry(BaseModel):
    paciente: str = ""
    diagnostico_name: str = ""
    diagnostico_code: str = ""
    procedimientos: list[EntryItem] = []
    medicamentos: list[EntryItem] = []
    insumos: list[EntryItem] = []

# New model for row deletion
class DeleteRows(BaseModel):
    ids: list[int]

# --------------------------
# API Endpoints
# --------------------------
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    global df
    try:
        contents = await file.read()
        file_location = f"./{file.filename}"
        with open(file_location, "wb") as f:
            f.write(contents)
        if file.filename.lower().endswith('.csv'):
            temp_df = pd.read_csv(BytesIO(contents))
        else:
            temp_df = pd.read_excel(BytesIO(contents))
        temp_df.columns = temp_df.columns.str.strip()
        if len(temp_df.columns) != len(REQUIRED_COLUMNS):
            raise HTTPException(
                status_code=400,
                detail=f"Expected {len(REQUIRED_COLUMNS)} columns, got {len(temp_df.columns)}"
            )
        else:
            temp_df.columns = REQUIRED_COLUMNS
        df = temp_df
        return {"message": "File uploaded and loaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/")
def get_data():
    records = df.to_dict(orient="records")
    # Attach an "id" field corresponding to the row's index.
    for idx, record in enumerate(records):
        record["id"] = idx
        for key, value in record.items():
            if isinstance(value, float) and math.isnan(value):
                record[key] = None
    return records

@app.get("/sync/diagnostic/")
def sync_diagnostic(name: str = None, code: str = None):
    if name:
        row = diag_df[diag_df["NOMBRE"].str.lower() == name.lower()]
    elif code:
        row = diag_df[diag_df["CÓDIGO"].astype(str) == str(code)]
    else:
        raise HTTPException(status_code=400, detail="Provide either name or code")
    if row.empty:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    return {"name": row.iloc[0]["NOMBRE"], "code": row.iloc[0]["CÓDIGO"]}

@app.get("/search/patients/")
def search_patients(query: str):
    results = df[df["NOMBRE DE BENEFICIARIO"].str.contains(query, case=False, na=False)]
    return results["NOMBRE DE BENEFICIARIO"].unique().tolist()

@app.get("/search/diagnostics/")
def search_diagnostics(query: str):
    results = diag_df[diag_df["NOMBRE"].str.contains(query, case=False, na=False)]
    return results["NOMBRE"].tolist()

@app.get("/search/procedures/")
def search_procedures(query: str):
    results = proc_df[proc_df["DESCRIPCIÓN"].str.contains(query, case=False, na=False)]
    return results["DESCRIPCIÓN"].tolist()

@app.get("/search/medications/")
def search_medications(query: str):
    results = med_df[med_df["DESCRIPCIÓN"].str.contains(query, case=False, na=False)]
    return results["DESCRIPCIÓN"].tolist()

@lru_cache(maxsize=1)
@app.get("/medications/full/")
def get_medications_full():
    code_col = "CODIGO" if "CODIGO" in med_df.columns else "CÓDIGO"
    return med_df[["DESCRIPCIÓN", code_col]].to_dict(orient="records")

@lru_cache(maxsize=1)
@app.get("/procedures/full/")
def get_procedures_full():
    code_col = "CODIGO" if "CODIGO" in proc_df.columns else "CÓDIGO"
    return proc_df[["DESCRIPCIÓN", code_col]].to_dict(orient="records")

@lru_cache(maxsize=1)
@app.get("/patients/full/")
def get_patients_full():
    return sorted(df["NOMBRE DE BENEFICIARIO"].dropna().unique().tolist())

@lru_cache(maxsize=1)
@app.get("/diagnostics/full/")
def get_diagnostics_full():
    return diag_df[["NOMBRE", "CÓDIGO"]].to_dict(orient="records")

@app.get("/download/")
def download_file():
    if not os.path.exists(DATA_FILE):
        raise HTTPException(status_code=404, detail="Data file not found")
    return FileResponse(
        path=DATA_FILE,
        filename="data.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.post("/add/")
def add_entry(entry: NewEntry):
    global df
    base_row = {
        "NOMBRE DE BENEFICIARIO": entry.paciente,
        "DIAGNOSTICO PRINCIPAL CIE-10": entry.diagnostico_code,
        "DIAGNOSTICO PRESUNTIVO O DIFINITIVO": entry.diagnostico_name,
        "OBSERVACIONES": ""
    }
    new_entries = []
    for item in entry.procedimientos:
        if item.name:
            row = base_row.copy()
            row["DESCRIPCIÓN"] = item.name
            row["CODIGO"] = item.code
            row["CANTIDAD"] = item.quantity
            new_entries.append(row)
    for item in entry.medicamentos:
        if item.name:
            row = base_row.copy()
            row["DESCRIPCIÓN"] = item.name
            row["CODIGO"] = item.code
            row["CANTIDAD"] = item.quantity
            new_entries.append(row)
    for item in entry.insumos:
        if item.name:
            row = base_row.copy()
            row["DESCRIPCIÓN"] = item.name
            row["CODIGO"] = item.code
            row["CANTIDAD"] = item.quantity
            new_entries.append(row)
    # Insert new entries below the last row with matching patient name and inherit base fields.
    current_rows = df.to_dict(orient="records")
    for new_row in new_entries:
        patient = new_row["NOMBRE DE BENEFICIARIO"]
        insertion_index = None
        for i in range(len(current_rows) - 1, -1, -1):
            if current_rows[i]["NOMBRE DE BENEFICIARIO"] == patient:
                new_row["CÓDIGO DEPENDENCIA\n(ESPECIALIDAD)\n"] = current_rows[i].get("CÓDIGO DEPENDENCIA\n(ESPECIALIDAD)\n", "")
                new_row["FECHA ANTENCION"] = current_rows[i].get("FECHA ANTENCION", "")
                new_row["CEDULA"] = current_rows[i].get("CEDULA", "")
                insertion_index = i + 1
                break
        if insertion_index is None:
            current_rows.append(new_row)
        else:
            current_rows.insert(insertion_index, new_row)
    df = pd.DataFrame(current_rows)
    df.to_excel(DATA_FILE, index=False, columns=df.columns.tolist())

    try:
        wb = load_workbook(DATA_FILE)
        ws = wb.active
        header = [cell.value for cell in ws[1]]
        patient_idx = header.index("NOMBRE DE BENEFICIARIO") + 1
        date_idx = header.index("FECHA ANTENCION") + 1
        fill1 = PatternFill(start_color="FF92D050", end_color="FF92D050", fill_type="solid")
        fill2 = PatternFill(start_color="FF00B0F0", end_color="FF00B0F0", fill_type="solid")
        current_fill = fill1
        prev_key = None
        for r in range(2, ws.max_row + 1):
            patient_val = ws.cell(row=r, column=patient_idx).value
            date_val = ws.cell(row=r, column=date_idx).value
            key = (patient_val, date_val)
            if key != prev_key:
                current_fill = fill2 if current_fill == fill1 else fill1
                prev_key = key
            for c in range(1, ws.max_column + 1):
                ws.cell(row=r, column=c).fill = current_fill
        wb.save(DATA_FILE)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving colored file: {e}")
    return {"message": "Entry added successfully!"}

@app.post("/delete/")
def delete_rows(delete_request: DeleteRows):
    global df
    records = df.to_dict(orient="records")
    # Filter out rows whose index (position) is in the provided list.
    new_records = [record for idx, record in enumerate(records) if idx not in delete_request.ids]
    df = pd.DataFrame(new_records)
    df.to_excel(DATA_FILE, index=False, columns=df.columns.tolist())
    return {"message": "Filas eliminadas exitosamente."}

@app.post("/save/")
def save_file():
    df.to_excel(DATA_FILE, index=False, columns=df.columns.tolist())
    return {"message": "File saved successfully."}

@app.on_event("shutdown")
def save_state():
    state = {"data_file": DATA_FILE}
    with open("state.json", "w") as f:
        json.dump(state, f)

# ========================
# 3. Mount React Frontend LAST
# ========================
build_path = os.path.join(os.path.dirname(__file__), "frontend", "build")

if os.path.exists(build_path):
    app.mount("/", StaticFiles(directory=build_path, html=True), name="static")
else:
    print("Warning: React build directory not found. Frontend will not be served.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
