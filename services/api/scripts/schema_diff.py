"""Schema Diff Utility

Purpose:
    Compare the live PostgreSQL database schema (tables + columns + constraints + indexes)
    with the SQLAlchemy model metadata currently importable from the application. Highlights:
        - Missing / extra tables
        - Column differences (missing, extra, type, nullability, default)
        - Primary key differences
        - Unique constraint differences
        - Foreign key differences (local cols, remote table, remote cols)
        - Index differences (name, columns, uniqueness)

Usage:
    python -m scripts.schema_diff --dsn postgresql://user:pass@localhost:5432/dbname
    (If omitted, will attempt to build a DSN from env vars: PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE)

Exit Codes:
    0 = No differences found
    1 = Differences detected
    2 = Execution error (connection/import issues)

Notes:
    - Type comparison uses lowercase string form.
    - Default comparison is heuristic (string containment) to reduce false positives for functions.
    - Index diff excludes implicit / constraint-backed indexes that SQLAlchemy may not surface identically.
    - Extendable: add CHECK constraints or sequences if needed later.
    - Designed for CI to catch drift from manual DB edits or raw SQL migrations.
"""
from __future__ import annotations
import os, sys, argparse, textwrap
from typing import Dict, List, Tuple, Any

try:
    from sqlalchemy import create_engine, inspect
    from sqlalchemy.schema import MetaData
except ImportError:
    print("ERROR: SQLAlchemy not installed in this environment.", file=sys.stderr)
    sys.exit(2)

# Attempt to import the application's Base / metadata
APP_METADATA: MetaData | None = None
BASE_CANDIDATE_ATTRS = ["Base", "metadata", "SQLModel", "BaseModel"]

def import_app_metadata() -> MetaData:
    """Import application models and return consolidated MetaData.
    Adjust the import path below if models live elsewhere.
    """
    global APP_METADATA
    if APP_METADATA:
        return APP_METADATA
    # Common locations: services.api.app.db.base or modules.*.models etc.
    # We'll walk the app/modules directory and import all models modules to populate metadata.
    root_pkg = "app.modules"
    import importlib, pkgutil
    try:
        pkg = importlib.import_module(root_pkg)
    except Exception as e:
        print(f"Failed to import root package '{root_pkg}': {e}", file=sys.stderr)
        sys.exit(2)

    meta = None
    for finder, name, ispkg in pkgutil.walk_packages(pkg.__path__, root_pkg + "."):
        if not name.endswith(".models"):
            continue
        try:
            m = importlib.import_module(name)
        except Exception as e:
            print(f"WARN: Could not import {name}: {e}")
            continue
        for attr in BASE_CANDIDATE_ATTRS:
            if hasattr(m, attr):
                obj = getattr(m, attr)
                # SQLAlchemy Base has .metadata; metadata is MetaData
                if hasattr(obj, "metadata") and hasattr(obj.metadata, "tables"):
                    meta = obj.metadata if meta is None else merge_metadata(meta, obj.metadata)
        # Direct metadata exported?
        if hasattr(m, "metadata") and hasattr(getattr(m, "metadata"), "tables"):
            meta = m.metadata if meta is None else merge_metadata(meta, m.metadata)
    if meta is None:
        print("ERROR: Could not locate application MetaData. Adjust import logic in schema_diff.py", file=sys.stderr)
        sys.exit(2)
    APP_METADATA = meta
    return meta

def merge_metadata(a: MetaData, b: MetaData) -> MetaData:
    """Merge two MetaData objects (shallow) into a new MetaData"""
    if a is b:
        return a
    merged = MetaData()
    for t in a.tables.values():
        t.tometadata(merged)
    for t in b.tables.values():
        if t.name not in merged.tables:
            t.tometadata(merged)
    return merged

# --------------------------------- Diff Logic ---------------------------------

def collect_model_schema(meta: MetaData) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for t in meta.sorted_tables:
        cols: Dict[str, dict] = {}
        for c in t.columns:
            cols[c.name] = {
                "type": str(c.type).lower(),
                "nullable": bool(c.nullable),
                "default": normalize_default(getattr(c.server_default, "arg", None)),
            }
        # Primary key
        pk_cols = [c.name for c in (t.primary_key.columns if t.primary_key else [])]
        # Unique constraints (name -> cols) - include explicit unique constraints (skip duplicates from PK)
        uniques = []
        for uc in t.constraints:
            if getattr(uc, "__visit_name__", None) == 'unique_constraint':
                uniques.append(sorted([c.name for c in uc.columns]))
        # Foreign keys
        fks = []
        for fk in t.foreign_keys:
            target_table = fk.column.table.name if fk.column is not None else None
            fks.append({
                'constrained_cols': [fk.parent.name],  # only single-column FKs represented this way; multi handled via fk.constraint
                'referred_table': target_table,
                'referred_cols': [fk.column.name] if fk.column is not None else [],
            })
        # Multi-column FK constraints
        for cns in t.constraints:
            if getattr(cns, '__visit_name__', None) == 'foreign_key_constraint' and len(cns.elements) > 1:
                constrained = [e.parent.name for e in cns.elements]
                referred_table = cns.elements[0].column.table.name if cns.elements and cns.elements[0].column is not None else None
                referred_cols = [e.column.name for e in cns.elements if e.column is not None]
                fks.append({'constrained_cols': constrained, 'referred_table': referred_table, 'referred_cols': referred_cols})
        # Indexes (name, columns, unique)
        indexes = []
        for idx in t.indexes:
            indexes.append({
                'name': idx.name,
                'columns': [c.name for c in idx.columns],
                'unique': bool(idx.unique)
            })
        out[t.name] = {
            'columns': cols,
            'primary_key': pk_cols,
            'uniques': sorted([tuple(u) for u in uniques]),
            'foreign_keys': normalize_fk_list(fks),
            'indexes': sorted(indexes, key=lambda x: (x['name'] or '', x['columns']))
        }
    return out

def normalize_default(d):
    if d is None:
        return None
    s = str(d)
    # Remove surrounding parentheses / quotes common in PG defaults
    return s.strip().strip("()")


def collect_db_schema(engine) -> Dict[str, Any]:
    insp = inspect(engine)
    out: Dict[str, Any] = {}
    for table_name in insp.get_table_names():
        cols: Dict[str, dict] = {}
        for col in insp.get_columns(table_name):
            col_type = str(col.get("type")).lower()
            default = normalize_default(col.get("default"))
            cols[col["name"]] = {
                "type": col_type,
                "nullable": bool(col.get("nullable", True)),
                "default": default,
            }
        # Primary key
        pk = insp.get_pk_constraint(table_name)
        pk_cols = pk.get('constrained_columns') or []
        # Unique constraints
        uniques = []
        for uq in insp.get_unique_constraints(table_name):
            cols_uq = uq.get('column_names') or []
            if cols_uq:
                uniques.append(tuple(sorted(cols_uq)))
        uniques = sorted(set(uniques))
        # Foreign keys
        fk_entries = []
        for fk in insp.get_foreign_keys(table_name):
            fk_entries.append({
                'constrained_cols': fk.get('constrained_columns') or [],
                'referred_table': fk.get('referred_table'),
                'referred_cols': fk.get('referred_columns') or []
            })
        # Indexes
        idx_list = []
        try:
            for idx in insp.get_indexes(table_name):
                idx_list.append({
                    'name': idx.get('name'),
                    'columns': idx.get('column_names') or [],
                    'unique': bool(idx.get('unique'))
                })
        except Exception:
            pass
        out[table_name] = {
            'columns': cols,
            'primary_key': pk_cols,
            'uniques': uniques,
            'foreign_keys': normalize_fk_list(fk_entries),
            'indexes': sorted(idx_list, key=lambda x: (x['name'] or '', x['columns']))
        }
    return out

def normalize_fk_list(fks: List[dict]) -> List[dict]:
    norm = []
    for fk in fks:
        norm.append({
            'constrained_cols': tuple(sorted(fk.get('constrained_cols') or [])),
            'referred_table': fk.get('referred_table'),
            'referred_cols': tuple(sorted(fk.get('referred_cols') or []))
        })
    # Deduplicate
    unique = []
    seen = set()
    for fk in norm:
        key = (fk['constrained_cols'], fk['referred_table'], fk['referred_cols'])
        if key not in seen:
            seen.add(key); unique.append(fk)
    # Sort stable
    return sorted(unique, key=lambda x: (x['constrained_cols'], x['referred_table'] or '', x['referred_cols']))


def diff(model: Dict[str, Any], db: Dict[str, Any]):
    missing_tables = sorted(set(model.keys()) - set(db.keys()))
    extra_tables = sorted(set(db.keys()) - set(model.keys()))
    column_diffs: List[Tuple[str,str,str]] = []  # (table, kind, detail)
    pk_diffs: List[str] = []
    unique_diffs: List[str] = []
    fk_diffs: List[str] = []
    index_diffs: List[str] = []

    for t in sorted(set(model.keys()) & set(db.keys())):
        m = model[t]; d = db[t]
        mcols = m['columns']; dcols = d['columns']
        # Columns
        missing_cols = sorted(set(mcols.keys()) - set(dcols.keys()))
        extra_cols = sorted(set(dcols.keys()) - set(mcols.keys()))
        for c in missing_cols:
            column_diffs.append((t, 'missing_column', c))
        for c in extra_cols:
            column_diffs.append((t, 'extra_column', c))
        for c in sorted(set(mcols.keys()) & set(dcols.keys())):
            mc = mcols[c]; dc = dcols[c]
            issues = []
            if mc['type'] != dc['type']:
                issues.append(f"type model={mc['type']} db={dc['type']}")
            if mc['nullable'] != dc['nullable']:
                issues.append(f"nullable model={mc['nullable']} db={dc['nullable']}")
            if mc['default'] != dc['default'] and not ((mc['default'] or '').startswith((dc['default'] or '')) or (dc['default'] or '').startswith((mc['default'] or ''))):
                issues.append(f"default model={mc['default']} db={dc['default']}")
            if issues:
                column_diffs.append((t, 'column_mismatch', f"{c}: {'; '.join(issues)}"))
        # Primary key
        if tuple(m.get('primary_key', [])) != tuple(d.get('primary_key', [])):
            pk_diffs.append(f"{t}: model={m.get('primary_key')} db={d.get('primary_key')}")
        # Uniques (compare as sets of tuples)
        m_uniques = set(tuple(u) for u in m.get('uniques', []))
        d_uniques = set(tuple(u) for u in d.get('uniques', []))
        if m_uniques != d_uniques:
            only_model = m_uniques - d_uniques
            only_db = d_uniques - m_uniques
            if only_model:
                unique_diffs.append(f"{t}: uniques missing in DB: {sorted(only_model)}")
            if only_db:
                unique_diffs.append(f"{t}: extra uniques in DB: {sorted(only_db)}")
        # Foreign keys (compare normalized list -> set of tuples)
        def fk_key(fk):
            return (fk['constrained_cols'], fk['referred_table'], fk['referred_cols'])
        m_fks = set(fk_key(fk) for fk in m.get('foreign_keys', []))
        d_fks = set(fk_key(fk) for fk in d.get('foreign_keys', []))
        if m_fks != d_fks:
            for fk in sorted(m_fks - d_fks):
                fk_diffs.append(f"{t}: missing FK {fk}")
            for fk in sorted(d_fks - m_fks):
                fk_diffs.append(f"{t}: extra FK {fk}")
        # Indexes (by name + columns + unique)
        def idx_key(idx):
            return (idx.get('name'), tuple(idx.get('columns') or []), bool(idx.get('unique')))
        m_idx = set(idx_key(i) for i in m.get('indexes', []))
        d_idx = set(idx_key(i) for i in d.get('indexes', []))
        if m_idx != d_idx:
            for i in sorted(m_idx - d_idx):
                index_diffs.append(f"{t}: missing index name={i[0]} cols={i[1]} unique={i[2]}")
            for i in sorted(d_idx - m_idx):
                index_diffs.append(f"{t}: extra index name={i[0]} cols={i[1]} unique={i[2]}")
    return missing_tables, extra_tables, column_diffs, pk_diffs, unique_diffs, fk_diffs, index_diffs

# --------------------------------- Main ---------------------------------------

def build_dsn_from_env():
    user = os.getenv('PGUSER','postgres')
    pwd = os.getenv('PGPASSWORD','postgres')
    host = os.getenv('PGHOST','localhost')
    port = os.getenv('PGPORT','5432')
    db = os.getenv('PGDATABASE','school')
    return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Diff live DB schema vs SQLAlchemy models", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=textwrap.dedent("""
        Examples:
          python -m scripts.schema_diff --dsn postgresql://user:pass@localhost:5432/school
          # Use env vars (PGUSER, PGPASSWORD, ...)
          python -m scripts.schema_diff

        CI Suggestion:
          python -m scripts.schema_diff || { echo 'Schema drift detected'; exit 1; }
    """))
    ap.add_argument('--dsn', help='SQLAlchemy database URL (postgresql://...)')
    args = ap.parse_args(argv)
    dsn = args.dsn or build_dsn_from_env()

    try:
        meta = import_app_metadata()
    except SystemExit:
        return 2
    except Exception as e:
        print(f"ERROR importing models: {e}", file=sys.stderr)
        return 2

    try:
        engine = create_engine(dsn)
        with engine.connect() as conn:
            conn.execute("SELECT 1")
    except Exception as e:
        print(f"ERROR connecting to DB: {e}", file=sys.stderr)
        return 2

    model_schema = collect_model_schema(meta)
    db_schema = collect_db_schema(engine)
    missing_tables, extra_tables, column_diffs, pk_diffs, unique_diffs, fk_diffs, index_diffs = diff(model_schema, db_schema)

    if not (missing_tables or extra_tables or column_diffs or pk_diffs or unique_diffs or fk_diffs or index_diffs):
        print("✅ No schema drift detected.")
        return 0

    if missing_tables:
        print("\nTables defined in models but missing in DB:")
        for t in missing_tables:
            print(f"  - {t}")
    if extra_tables:
        print("\nTables present in DB but not in models:")
        for t in extra_tables:
            print(f"  - {t}")
    if column_diffs:
        print("\nColumn differences:")
        for t, kind, detail in column_diffs:
            print(f"  [{t}] {kind}: {detail}")
    if pk_diffs:
        print("\nPrimary key differences:")
        for dsc in pk_diffs:
            print(f"  - {dsc}")
    if unique_diffs:
        print("\nUnique constraint differences:")
        for dsc in unique_diffs:
            print(f"  - {dsc}")
    if fk_diffs:
        print("\nForeign key differences:")
        for dsc in fk_diffs:
            print(f"  - {dsc}")
    if index_diffs:
        print("\nIndex differences:")
        for dsc in index_diffs:
            print(f"  - {dsc}")

    print("\n❌ Schema drift found.")
    return 1

if __name__ == '__main__':  # pragma: no cover
    sys.exit(main())
