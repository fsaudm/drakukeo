import pandas as pd
import os
import sys

# --- Configuration ---
# Get the directory where the script itself is located
script_dir = os.path.dirname(os.path.abspath(__file__))

SOURCE_EXCEL_FILE = os.path.join(script_dir, "maestro_medicamentos.xlsx")
OUTPUT_CSV_FILE = os.path.join(script_dir, "medications_processed.csv")
REQUIRED_COLS = ['Principio Activo', 'Primer Nivel de Desagregación', 'Forma Farmacéutica', 'Concentración']
OUTPUT_COL_NAME = 'concat_id'
# ---

def preprocess_medications():
    """
    Reads the source Excel, concatenates specified columns,
    and saves the result to a CSV file.
    """
    print(f"Reading source file: {SOURCE_EXCEL_FILE}")
    try:
        med_df = pd.read_excel(SOURCE_EXCEL_FILE)
    except FileNotFoundError:
        print(f"ERROR: Source file not found at {SOURCE_EXCEL_FILE}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to read Excel file: {e}")
        sys.exit(1)

    # Verify required columns exist (case-insensitive check and rename)
    missing_cols = []
    rename_map = {}
    for req_col in REQUIRED_COLS:
        found = False
        for existing_col in med_df.columns:
            if existing_col.strip().lower() == req_col.strip().lower():
                if existing_col != req_col: # Prepare rename if casing/spacing differs
                    rename_map[existing_col] = req_col
                found = True
                break
        if not found:
            missing_cols.append(req_col)

    if missing_cols:
        print(f"ERROR: Missing required columns in {SOURCE_EXCEL_FILE}: {', '.join(missing_cols)}")
        sys.exit(1)

    # Apply renaming if necessary
    if rename_map:
        print(f"Renaming columns: {rename_map}")
        med_df.rename(columns=rename_map, inplace=True)

    print("Generating concatenated ID...")
    # Convert parts to string and handle potential NaN values, then strip extra spaces
    med_df[OUTPUT_COL_NAME] = (
        med_df[REQUIRED_COLS[0]].astype(str).fillna('') + " " +
        med_df[REQUIRED_COLS[1]].astype(str).fillna('') + " " +
        med_df[REQUIRED_COLS[2]].astype(str).fillna('') + " " +
        med_df[REQUIRED_COLS[3]].astype(str).fillna('')
    ).str.strip().str.replace(r'\s+', ' ', regex=True) # Consolidate multiple spaces

    # Select and save the processed column
    processed_df = med_df[[OUTPUT_COL_NAME]].drop_duplicates().reset_index(drop=True)

    # Check if the concatenated string is unique
    if processed_df[OUTPUT_COL_NAME].duplicated().any():
        print("WARNING: The generated concatenated string is NOT unique across all rows!")
        print("Duplicated values:")
        print(processed_df[processed_df[OUTPUT_COL_NAME].duplicated()][OUTPUT_COL_NAME])
        # Decide if you want to stop or continue despite non-uniqueness
        # sys.exit(1) # Uncomment to stop if non-unique

    print(f"Saving processed data to: {OUTPUT_CSV_FILE}")
    try:
        processed_df.to_csv(OUTPUT_CSV_FILE, index=False, encoding='utf-8')
        print("Pre-processing complete.")
    except Exception as e:
        print(f"ERROR: Failed to save CSV file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    preprocess_medications()
