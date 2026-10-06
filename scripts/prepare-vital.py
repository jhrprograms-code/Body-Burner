#!/usr/bin/env python3
"""Prepare private, optimized Vital media. No uploads and no source modifications."""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=pathlib.Path, help='Extracted 400vitalanimations folder')
    parser.add_argument('--output', type=pathlib.Path, required=True,
                        help='New output folder outside the source folder and any Git repository')
    parser.add_argument('--scan-only', action='store_true')
    args = parser.parse_args()
    source, output = args.source.resolve(), args.output.resolve()
    if not source.is_dir():
        parser.error('Source must be an existing extracted folder.')
    if output == source or source in output.parents:
        parser.error('Output must be outside the purchased source folder.')
    if any((p / '.git').exists() for p in [output, *output.parents]):
        parser.error('Keep licensed output outside Git repositories.')
    if output.exists():
        parser.error('Choose a new output folder; existing files will not be overwritten.')
    records, videos, issues = {}, {}, []
    for file in sorted(source.rglob('*')):
        if not file.is_file() or file.is_symlink() or '__MACOSX' in file.parts:
            continue
        if file.suffix.lower() == '.json':
            try:
                data = json.loads(file.read_text(encoding='utf-8-sig'))
            except (ValueError, UnicodeError):
                issues.append('Unreadable JSON: ' + str(file.relative_to(source)))
                continue
            if not isinstance(data, list):
                continue
            for record in data:
                if not isinstance(record, dict) or 'id' not in record or 'name' not in record:
                    continue
                identifier = str(record['id'])
                if not identifier.isascii() or not identifier.isdigit():
                    issues.append('Unsupported exercise ID: ' + identifier)
                    continue
                if identifier in records:
                    raise ValueError('Duplicate metadata ID: ' + identifier)
                records[identifier] = record
        elif file.suffix.lower() == '.mp4':
            identifier = file.stem
            if identifier in videos:
                raise ValueError('Duplicate video filename ID: ' + identifier)
            videos[identifier] = file
    if not records:
        raise ValueError('No exercise metadata found. Select the parent of the three workout folders.')
    missing = sorted(set(records) - set(videos))
    unmatched = sorted(set(videos) - set(records))
    print(f'{len(records)} metadata records; {len(videos)} videos; '
          f'{len(missing)} missing videos; {len(unmatched)} unmatched videos.')
    report = {'records': len(records), 'videos': len(videos), 'missingVideoIds': missing,
              'unmatchedVideoIds': unmatched, 'issues': issues, 'items': []}
    if args.scan_only:
        print(json.dumps(report, indent=2))
        return
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        raise ValueError('Install FFmpeg first, then rerun. With Homebrew: brew install ffmpeg')
    output.mkdir(parents=True)
    (output / 'media').mkdir()
    # Defense in depth if this folder is later moved under a repository.
    (output / '.gitignore').write_text('*\n', encoding='utf-8')
    (output / 'README.txt').write_text(
        'Licensed private assets. Do not commit or redistribute this folder.\n'
        'Manifest matches are by filename only. Visually review before app publication.\n',
        encoding='utf-8')
    matched = sorted(set(records) & set(videos))
    for index, identifier in enumerate(matched, 1):
        original = videos[identifier]
        target = output / 'media' / (identifier + '.mp4')
        print(f'[{index}/{len(matched)}] {identifier} {records[identifier]["name"]}', flush=True)
        try:
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-n', '-i', str(original),
                            '-map', '0:v:0', '-an', '-vf',
                            'scale=640:640:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=24',
                            '-c:v', 'libx264', '-crf', '26', '-preset', 'medium',
                            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target)], check=True)
            probe = json.loads(subprocess.check_output(
                ['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(target)]))
            duration = float(probe['format']['duration'])
            if duration <= 0 or not any(s.get('codec_type') == 'video' for s in probe['streams']):
                raise ValueError('Invalid encoded video')
            if target.stat().st_size >= original.stat().st_size:
                report['issues'].append(identifier + ': encoded copy is not smaller')
            report['items'].append({'providerId': identifier, 'name': records[identifier]['name'],
                                    'file': 'media/' + target.name, 'duration': duration,
                                    'bytes': target.stat().st_size,
                                    'sourceBytes': original.stat().st_size,
                                    'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                                    'visuallyVerified': False})
        except (subprocess.CalledProcessError, ValueError, KeyError) as error:
            report['issues'].append(identifier + ': conversion failed (' + type(error).__name__ + ')')
            target.unlink(missing_ok=True)
        (output / 'import-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (output / 'catalog.json').write_text(json.dumps(list(records.values()), indent=2), encoding='utf-8')
    print(f'Finished: {len(report["items"])} prepared videos in {output}')
    print('Next: upload import-report.json for review. Keep the videos private for bulk import.')
    if report['issues'] or missing or unmatched:
        print('Some items need attention; read import-report.json before publishing.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as error:
        print('Error: ' + str(error), file=sys.stderr)
        sys.exit(1)
