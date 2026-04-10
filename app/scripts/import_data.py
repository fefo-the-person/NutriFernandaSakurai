"""
Import historical data from the Excel spreadsheet into Supabase.

Usage:
  pip install pandas openpyxl supabase
  python scripts/import_data.py

Set environment variables before running:
  export SUPABASE_URL=https://xxxx.supabase.co
  export SUPABASE_SERVICE_KEY=eyJ...   # Use the SERVICE KEY (not anon) for bulk insert
"""

import os, re, sys
import pandas as pd
from supabase import create_client

EXCEL_PATH = '../../2026_Planilha_DRE_anual.xls.xlsx'

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─────────────────────────────────────────────────────────────
# 1. Parse all consultation records from the Excel file
# ─────────────────────────────────────────────────────────────

CONSULTATION_CODES = {100, 101}
EXPENSE_CODES = {10, 12, 16, 26, 31, 40}

EXPENSE_CATEGORIES = {
    10: 'Aluguel', 12: 'Energia', 16: 'Telefone',
    26: 'Livros/Cursos', 31: 'Eventos/Cursos', 40: 'Imposto (DARF)',
}

def parse_desc(desc):
    desc = str(desc).strip()
    if 'Maria Clara' in desc:
        m = re.search(r'CPF\s*(\d{11})', desc)
        return 'Maria Clara', m.group(1) if m else None
    fmt = re.search(r'(\d{3})\.(\d{3})\.(\d{3})-(\d{2})', desc)
    if fmt:
        return desc[:fmt.start()].strip(), ''.join(fmt.groups())
    raw = re.search(r'(\d{11})\??', desc)
    if raw:
        return desc[:raw.start()].strip(), raw.group(1)
    return desc, None

def normalize_no_cpf_name(name):
    nl = name.lower()
    if 'marisa' in nl:         return 'Marisa Tieko'
    if 'gustavo chiesa' in nl: return 'Gustavo Chiesa'
    if 'ayumi' in nl:          return 'Ayumi (Internacional)'
    if 'daniel' in nl:         return 'Daniel Internacional'
    if 'lucas rivelli' in nl:  return 'Lucas Rivelli'
    return name

consultations_raw = []
expenses_raw = []

xl = pd.ExcelFile(EXCEL_PATH)
for sheet in ['01','02','03','04','05','06','07','08','09','10','11','12']:
    df = pd.read_excel(EXCEL_PATH, sheet_name=sheet, header=None)
    for _, row in df.iterrows():
        try:
            code = int(row[2])
        except:
            continue
        val = float(row[4]) if pd.notna(row[4]) else 0.0
        date_val = row[1]
        try:
            dp = pd.to_datetime(date_val, dayfirst=True) if isinstance(date_val, str) else pd.to_datetime(date_val)
            date_str = dp.strftime('%Y-%m-%d')
        except:
            continue

        if code in CONSULTATION_CODES and val > 0:
            name, cpf = parse_desc(row[3])
            if not cpf:
                name = normalize_no_cpf_name(name)
            # Code 100 = Online, Code 101 = Presencial
            channel = 'ONLINE' if code == 100 else 'PRESENCIAL'
            consultations_raw.append({'name': name.strip(), 'cpf': cpf, 'date': date_str, 'amount': val, 'channel': channel})

        elif code in EXPENSE_CODES and val < 0:
            desc = str(row[3]).strip().capitalize()
            expenses_raw.append({
                'date': date_str,
                'category': EXPENSE_CATEGORIES.get(code, 'Outro'),
                'description': desc,
                'amount': abs(val),
            })

print(f"Parsed {len(consultations_raw)} consultations, {len(expenses_raw)} expenses")

# ─────────────────────────────────────────────────────────────
# 2. Upsert patients (deduplicated by CPF or name)
# ─────────────────────────────────────────────────────────────

# Build unique patient set
patient_map = {}   # key -> {'cpf': ..., 'name': ...}
for c in consultations_raw:
    key = c['cpf'] if c['cpf'] else f"NO_CPF_{c['name'].upper().replace(' ','_')}"
    if key not in patient_map:
        patient_map[key] = {'cpf': c['cpf'], 'name': c['name']}

print(f"Unique patients: {len(patient_map)}")

# Insert patients and collect their UUIDs
patient_uuid = {}
for key, p in patient_map.items():
    data = {'name': p['name']}
    if p['cpf']:
        data['cpf'] = p['cpf']
    if p['cpf']:
        # Try to find existing
        res = sb.table('patients').select('id').eq('cpf', p['cpf']).execute()
        if res.data:
            patient_uuid[key] = res.data[0]['id']
            continue
    # Insert new
    res = sb.table('patients').insert(data).execute()
    patient_uuid[key] = res.data[0]['id']

print("Patients inserted/matched.")

# ─────────────────────────────────────────────────────────────
# 3. Insert consultations
# ─────────────────────────────────────────────────────────────

consultation_rows = []
for c in consultations_raw:
    key = c['cpf'] if c['cpf'] else f"NO_CPF_{c['name'].upper().replace(' ','_')}"
    pid = patient_uuid.get(key)
    if not pid:
        print(f"  Warning: no patient found for key={key}")
        continue
    consultation_rows.append({
        'patient_id': pid,
        'date':       c['date'],
        'amount':     c['amount'],
        'channel':    c['channel'],  # 100=ONLINE, 101=PRESENCIAL
    })

# Insert in batches of 100
for i in range(0, len(consultation_rows), 100):
    sb.table('consultations').insert(consultation_rows[i:i+100]).execute()

print(f"Inserted {len(consultation_rows)} consultations.")

# ─────────────────────────────────────────────────────────────
# 4. Insert expenses
# ─────────────────────────────────────────────────────────────

for i in range(0, len(expenses_raw), 100):
    sb.table('expenses').insert(expenses_raw[i:i+100]).execute()

print(f"Inserted {len(expenses_raw)} expenses.")
print("\nDone! Historical data imported successfully.")
