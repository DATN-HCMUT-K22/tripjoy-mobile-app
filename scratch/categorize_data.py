import json
import collections

# Load the data
with open(r'd:\datn_tripjoy\scratch\excel_data.json', 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

data = raw_data['data']

# Group by Module (MDxx)
modules = collections.defaultdict(list)

module_names = {
    "MD01": "Social & Community",
    "MD02": "Group & Chat",
    "MD03": "AI Planning & Suggestions",
    "MD04": "Trip Management & Expenses",
    "MD05": "Authentication & Account"
}

for item in data:
    if isinstance(item.get('ID'), str) and item['ID'].startswith('TC-'):
        # Extract MDxx
        parts = item['ID'].split('-')
        if len(parts) >= 2:
            module_id = parts[1]
            modules[module_id].append(item)
    else:
        modules["Unknown"].append(item)

# Sort modules
sorted_module_ids = sorted(modules.keys())

# Generate Markdown
output = "# Test Case Design Categorized by Module\n\n"

for mid in sorted_module_ids:
    name = module_names.get(mid, mid)
    output += f"## Module: {name} ({mid})\n\n"
    output += "| ID | Use Case | Mô tả | Đầu vào | Đầu ra mong đợi | Trạng thái |\n"
    output += "|---|---|---|---|---|---|\n"
    for item in modules[mid]:
        # Handle NaN and potential None values
        def clean(val):
            if val is None or (isinstance(val, float) and str(val) == 'nan'):
                return "-"
            return str(val).replace('\n', '<br>')

        output += f"| {clean(item.get('ID'))} | {clean(item.get('Use Case'))} | {clean(item.get('Mô tả'))} | {clean(item.get('Đầu vào'))} | {clean(item.get('Đầu ra mong đợi'))} | {clean(item.get('Trạng thái thực hiện'))} |\n"
    output += "\n"

with open(r'd:\datn_tripjoy\scratch\categorized_test_cases.md', 'w', encoding='utf-8') as f:
    f.write(output)

print("Categorization complete.")
