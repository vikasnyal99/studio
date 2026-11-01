#!/usr/bin/env python3
"""Install Studio skill links without overwriting existing skills.

Default: .agents/skills in this repo and $CODEX_HOME/skills, or ~/.codex/skills.
--check is read-only and reports Claude/Codex drift since the last reviewed sync.
--record-sync records content hashes after both versions have been reviewed.
--destination permits an alternate skill directory for isolated validation.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os


def skill_pairs(root, skills):
    """Find the primary Claude source for skills that have a Claude counterpart."""
    pairs = {}
    for skill in skills:
        candidates = [root / '.claude/skills' / skill.name / 'SKILL.md']
        candidates += [root / project / '.claude/skills' / skill.name / 'SKILL.md'
                       for project in ('video-studio', 'animation-studio', 'audio-studio', 'idea-generator')]
        sources = {p.resolve() for p in candidates if p.is_file()}
        if len(sources) > 1:
            raise ValueError(f'multiple Claude sources for {skill.name}: {sources}')
        if sources:
            pairs[skill.name] = (next(iter(sources)), skill)
    return pairs


def fingerprint(paths):
    digest = hashlib.sha256()
    for path in paths:
        if path.is_file():
            digest.update(path.name.encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()


def pair_hashes(root, pairs):
    result = {}
    for name, (claude, codex) in pairs.items():
        codex_files = sorted(p for p in codex.rglob('*') if p.is_file())
        result[name] = {
            'claude_path': str(claude.relative_to(root)),
            'claude_sha256': fingerprint([claude]),
            'codex_sha256': fingerprint(codex_files),
        }
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', type=Path)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--record-sync', action='store_true', help='record reviewed Claude/Codex skill hashes')
    args = parser.parse_args()
    if args.check and args.record_sync:
        parser.error('--check and --record-sync cannot be combined')
    root = Path(__file__).resolve().parent.parent
    source = root / 'docs/codex-skills'
    repo = root / '.agents/skills'
    user = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex'))) / 'skills'
    destinations = [args.destination.expanduser().absolute()] if args.destination else [repo, user.expanduser().absolute()]
    skills = sorted(p.parent for p in source.glob('*/SKILL.md'))
    sync_file = root / 'docs/skill-sync.json'
    pairs = skill_pairs(root, skills)
    hashes = pair_hashes(root, pairs)
    if not skills:
        parser.exit(1, f'No skills found in {source}\n')
    missing, conflicts = [], []
    for destination in destinations:
        for skill in skills:
            target = destination / skill.name
            if target.is_symlink() and target.resolve() == skill.resolve():
                print(f'OK {target}')
            elif target.exists() or target.is_symlink():
                conflicts.append(target)
                print(f'CONFLICT {target}: preserved')
            else:
                missing.append((skill, target))
                print(f'MISSING {target}' if args.check else f'LINK {target} -> {skill}')
    if conflicts:
        parser.exit(1, 'No links created: resolve conflicting names explicitly.\n')
    if args.check:
        recorded = json.loads(sync_file.read_text())['pairs'] if sync_file.is_file() else {}
        stale = []
        for name, current in hashes.items():
            previous = recorded.get(name)
            if previous is None:
                stale.append(name)
                print(f'UNREVIEWED {name}: no reviewed Claude/Codex pair recorded')
                continue
            for side in ('claude', 'codex'):
                if current[f'{side}_sha256'] != previous.get(f'{side}_sha256'):
                    stale.append(name)
                    print(f'CHANGED {name}: {side} content changed since reviewed sync')
        total = len(skills) * len(destinations)
        parser.exit(1 if missing or stale else 0, f'{total-len(missing)}/{total} Studio skill links installed, {len(set(stale))} pairs need review.\n')
    if args.record_sync:
        sync_file.write_text(json.dumps({'pairs': hashes}, indent=2, sort_keys=True) + '\n')
        print(f'Recorded {len(hashes)} reviewed Claude/Codex skill pairs in {sync_file}')
    if not args.dry_run:
        for skill, target in missing:
            target.parent.mkdir(parents=True, exist_ok=True)
            # Repo links stay relative so they survive a clone or a moved folder.
            link = os.path.relpath(skill, target.parent) if target.parent == repo else skill.resolve()
            target.symlink_to(link, target_is_directory=True)
    print(f'{len(skills)} skills {"planned" if args.dry_run else "ready"} in {", ".join(map(str, destinations))}')


if __name__ == '__main__':
    main()
