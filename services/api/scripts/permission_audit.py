"""Permission coverage audit script.

Scans router files for FastAPI route decorators and checks whether protected
(mutating) endpoints declare a require('<perm>') dependency. Reports: 
 - Missing permission dependency on mutating endpoints (POST/PUT/PATCH/DELETE)
 - Unknown permissions referenced (not present in DB) when DB accessible
 - Orphan permissions in DB not referenced in code (optional)

Run (example):
  python -m scripts.permission_audit --print-unused

Exit code 1 if missing coverage found (for CI gate) unless --no-fail set.
"""
from __future__ import annotations
import ast, os, re, sys, argparse, textwrap
from pathlib import Path
from typing import List, Set, Tuple

# Root relative to this script file (assuming placed in services/api/scripts)
ROOT = Path(__file__).resolve().parents[1] / 'app' / 'modules'
RE_REQUIRE_CALL = re.compile(r"require\('([^']+)'\)")
ROUTE_DECORATOR_PREFIXES = { 'get','post','put','patch','delete' }
MUTATING_METHODS = { 'post','put','patch','delete' }


def extract_permissions_from_source(source: str) -> Set[str]:
    return set(RE_REQUIRE_CALL.findall(source))


def parse_routes_and_perms(file_path: Path):
    text = file_path.read_text(encoding='utf-8')
    tree = ast.parse(text, filename=str(file_path))
    routes = []  # (function_name, method:str, has_require:bool, permissions:set)
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            method_decorators = []
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                    if dec.func.attr in ROUTE_DECORATOR_PREFIXES:
                        method_decorators.append(dec.func.attr)
            if not method_decorators:
                continue
            # Determine if any dependency uses require('...')
            src_segment = ast.get_source_segment(text, node)
            perms = extract_permissions_from_source(src_segment or '')
            has_require = bool(perms)
            routes.append((node.name, method_decorators, has_require, perms))
    return routes, extract_permissions_from_source(text)


def discover_router_files() -> List[Path]:
    return [p for p in ROOT.rglob('router.py')]


def load_db_permissions() -> Set[str]:
    # Best-effort: attempt to read database if configured
    try:
        import sqlalchemy as sa
        from app.core.db import engine
        with engine.connect() as conn:
            rows = conn.execute(sa.text('SELECT code FROM core.permission')).fetchall()
            return {r[0] for r in rows}
    except Exception:
        return set()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--print-unused', action='store_true')
    ap.add_argument('--no-fail', action='store_true', help='Do not exit 1 on missing perms')
    args = ap.parse_args()

    router_files = discover_router_files()
    missing = []
    all_code_perms: Set[str] = set()

    for rf in router_files:
        routes, perms_in_file = parse_routes_and_perms(rf)
        all_code_perms |= perms_in_file
        for fn, methods, has_req, perms in routes:
            if any(m in MUTATING_METHODS for m in methods) and not has_req:
                missing.append((rf, fn, ','.join(methods)))

    db_perms = load_db_permissions()
    unknown = sorted([p for p in all_code_perms if db_perms and p not in db_perms])
    unused = sorted([p for p in db_perms if p not in all_code_perms]) if args.print_unused and db_perms else []

    if missing:
        print('\n[Missing Permission Dependencies]')
        for path, fn, methods in missing:
            rel = path.relative_to(ROOT.parents[2]) if path.exists() else path
            print(f' - {rel}::{fn} [{methods}]')
    else:
        print('All mutating routes have permission dependencies.')

    if unknown:
        print('\n[Unknown Permissions Referenced]')
        for p in unknown:
            print(f' - {p}')
    else:
        if db_perms:
            print('No unknown permissions referenced.')

    if unused:
        print('\n[Unused Permissions in DB]')
        for p in unused:
            print(f' - {p}')

    problems = bool(missing or unknown)
    if problems and not args.no_fail:
        sys.exit(1)

if __name__ == '__main__':
    main()
