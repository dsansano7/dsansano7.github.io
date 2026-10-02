"""
Wwise Generic Batch Audio Importer
Author: Diego Sansano
    DESCRIPTION:
        Universal asset pipeline script designed to automate audio ingestion into Wwise.
        It scans local subfolders, creates corresponding Random Sequence Containers 
        under a master category matching the parent directory name, imports all WAV 
        variations, and generates linked Play events automatically.
        
    HOW TO USE:
        1. Open your Wwise project (ensure WAAPI is enabled under Project > User Settings).
        2. Run the script:
           - Via CLI: python wwise_batch_audio_importer.py -p "C:/Path/To/AudioFolder"
           - Or run directly and enter/drag the folder path when prompted (press Enter to use the script's directory).
"""

import argparse
import sys
from pathlib import Path
from waapi import WaapiClient, CannotConnectToWaapiException


def resolve_target_directory() -> Path:
    """Resolves the target audio folder from CLI arguments, user input, or local fallback."""
    parser = argparse.ArgumentParser(description="Wwise Generic Batch Audio Importer")
    parser.add_argument(
        "-p", "--path",
        type=str,
        help="Path to the directory containing audio subfolders"
    )
    args = parser.parse_args()

    if args.path:
        target = Path(args.path).resolve()
        if target.is_dir():
            return target
        print(f"[ERROR] Specified path does not exist or is not a directory: {target}")
        sys.exit(1)

    user_input = input("Enter path to audio directory (Press Enter to use current script location): ").strip()
    if user_input:
        target = Path(user_input.strip('"\'')).resolve()
        if target.is_dir():
            return target
        print(f"[ERROR] Entered path does not exist or is not a directory: {target}")
        sys.exit(1)

    # 3. Fallback: la carpeta donde reside el script
    return Path(__file__).parent.resolve()


def get_audio_root(client) -> str:
    candidates = [
        r"\Containers\Default Work Unit",
        r"\Actor-Mixer Hierarchy\Default Work Unit",
    ]
    for candidate in candidates:
        res = client.call(
            "ak.wwise.core.object.get",
            {"from": {"path": [candidate]}},
            options={"return": ["id", "path"]},
        )
        if res.get("return"):
            return candidate
    raise RuntimeError("Default Work Unit not found.")


def main():
    target_dir = resolve_target_directory()
    category_name = target_dir.name

    asset_folders = [item for item in target_dir.iterdir() if item.is_dir()]

    if not asset_folders:
        print(f"[WARNING] No subfolders found in: {target_dir}")
        return

    print(f"\n[INFO] Target Directory: {target_dir}")
    print(f"[INFO] Target Category: '{category_name}'")
    print(f"[INFO] {len(asset_folders)} subfolder(s) detected:")
    for folder in asset_folders:
        print(f"  - {folder.name}")

    try:
        with WaapiClient() as client:
            print("\n[OK] Connected successfully to Wwise Authoring.")
            audio_root = get_audio_root(client)
            print(f"[INFO] Root Path Detected: {audio_root}")

            master_folder_args = {
                "parent": audio_root,
                "type": "Folder",
                "name": category_name,
                "onNameConflict": "merge"
            }
            client.call("ak.wwise.core.object.create", master_folder_args)
            category_root = f"{audio_root}\\{category_name}"
            print(f"[OK] Category folder verified: {category_root}")

            for folder in asset_folders:
                container_name = folder.name
                wav_files = list(folder.glob("*.wav"))

                if not wav_files:
                    print(f"\n[SKIP] '{container_name}' contains no .wav files.")
                    continue

                print(f"\nProcessing: '{container_name}' ({len(wav_files)} audio files)")
                container_path = f"{category_root}\\{container_name}"

                container_args = {
                    "parent": category_root,
                    "type": "RandomSequenceContainer",
                    "name": container_name,
                    "onNameConflict": "merge"
                }
                container_res = client.call("ak.wwise.core.object.create", container_args)
                container_id = container_res.get("id")
                print(f"[OK] Container verified: {container_name} (ID: {container_id})")

                import_entries = []
                for wav in wav_files:
                    import_entries.append({
                        "audioFile": str(wav.resolve()),
                        "objectPath": f"{container_path}\\<Sound>{wav.stem}"
                    })

                import_args = {
                    "importOperation": "createNew",
                    "default": {"importLanguage": "SFX"},
                    "imports": import_entries
                }
                import_res = client.call("ak.wwise.core.audio.import", import_args)
                imported_count = len(import_res.get("objects", []))
                print(f"[OK] {imported_count} Sound SFX imported into '{container_name}'")

                event_name = f"Play_{container_name}"
                event_args = {
                    "parent": r"\Events\Default Work Unit",
                    "type": "Event",
                    "name": event_name,
                    "onNameConflict": "merge",
                    "children": [
                        {
                            "name": "",
                            "type": "Action",
                            "@ActionType": 1,
                            "@Target": container_id
                        }
                    ]
                }
                client.call("ak.wwise.core.object.create", event_args)
                print(f"[OK] Event linked: {event_name}")

            print(f"\n[SUCCESS] Ingestion completed for category '{category_name}'.")

    except CannotConnectToWaapiException:
        print("\n[ERROR] Unable to connect to Wwise.")
        print("Ensure Wwise Authoring is open with WAAPI enabled under User Preferences.")
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()