import pandas as pd
import json
import sys

file_path = r'd:\datn_tripjoy\docs\Test case design with implementation details.xlsx'
output_path = r'd:\datn_tripjoy\scratch\excel_data.json'

try:
    df = pd.read_excel(file_path)
    # Convert all data to string to avoid serialization issues with NaN or dates
    data = df.to_dict(orient='records')
    
    # We want to group by module. Let's find the column that looks like a module.
    # Based on common test case designs, it might be 'Module', 'Feature', or similar.
    # Let's just dump the columns to a text file first to be sure.
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "columns": df.columns.tolist(),
            "data": data
        }, f, ensure_ascii=False, indent=2)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
