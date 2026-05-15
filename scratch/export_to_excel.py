import pandas as pd
import json
import sys

# Load the data
json_path = r'd:\datn_tripjoy\scratch\excel_data.json'
output_excel_path = r'd:\datn_tripjoy\docs\Test_case_design_categorized.xlsx'

try:
    with open(json_path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)

    df = pd.DataFrame(raw_data['data'])

    # Filter out rows where the last column contains "Cần xem lại"
    # The column name is likely "Unnamed: 7" based on previous analysis
    last_col = df.columns[-1]
    
    # Filter: exclude rows where last_col contains "Cần xem lại"
    # We check if it's a string and contains the phrase, handling NaN values
    df = df[~df[last_col].astype(str).str.contains("Cần xem lại", na=False)]

    # Drop the Unnamed column if it's now mostly empty or if it was just for notes
    # The user asked to "bỏ đi những row có text Cần xem lại", 
    # but I'll keep the column if there are other notes, otherwise drop it if it's empty after filtering.
    if last_col.startswith('Unnamed') and df[last_col].isnull().all():
        df = df.drop(columns=[last_col])

    # Define module mapping
    module_names = {
        "MD01": "Social & Community",
        "MD02": "Group & Chat",
        "MD03": "AI Planning & Suggestions",
        "MD04": "Trip Management & Expenses",
        "MD05": "Authentication & Account"
    }

    # Add Module ID and Name columns
    def get_module_id(row):
        val = row.get('ID')
        if isinstance(val, str) and val.startswith('TC-'):
            parts = val.split('-')
            if len(parts) >= 2:
                return parts[1]
        return "Unknown"

    df['Module_ID'] = df.apply(get_module_id, axis=1)
    df['Module_Name'] = df['Module_ID'].map(module_names).fillna(df['Module_ID'])

    # Reorder columns to put Module at the front
    cols = df.columns.tolist()
    cols = ['Module_ID', 'Module_Name'] + [c for c in cols if c not in ['Module_ID', 'Module_Name']]
    df = df[cols]

    # Create Excel Writer
    with pd.ExcelWriter(output_excel_path, engine='openpyxl') as writer:
        # Write the full list
        df.to_excel(writer, sheet_name='All Test Cases', index=False)
        
        # Write separate sheets for each module
        for mid in sorted(df['Module_ID'].unique()):
            module_df = df[df['Module_ID'] == mid]
            sheet_name = mid
            if mid in module_names:
                sheet_name = f"{mid} - {module_names[mid]}"[:31]
            module_df.to_excel(writer, sheet_name=sheet_name, index=False)

    print(f"Excel file updated at: {output_excel_path}")
    print(f"Filtered out rows with 'Cần xem lại'. Remaining rows: {len(df)}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
