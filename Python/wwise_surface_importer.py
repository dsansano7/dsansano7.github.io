from pathlib import Path
from waapi import WaapiClient, CannotConnectToWaapiException
import os

def get_audio_root(client) -> str:
	candidates = [r"\Containers\Default Work Unit",
        r"\Actor-Mixer Hierarchy\Default Work Unit",
	]

	for candidate in candidates:
		res = client.call(
			"ak.wwise.core.object.get",
			{"from": {"path": [candidate]}},
			options = {"return":["id", "path"]},
		)
		if res.get("return"):
			return candidate
	raise RuntimeError("Default Work Unit not found.")

def main():

	script_dir = Path(__file__).parent.resolve()
	surface_folders = []

	for item in script_dir.iterdir():
		if item.is_dir():
			surface_folders.append(item)

	if not surface_folders:
		print(f"[WARNING] NO SUBFOLDERS FOUNDED IN; {script_dir}")
		return

	print(f"{len(surface_folders)} surfaces detected:")

	for folder in surface_folders:
		print (f"- {folder.name}")

	try:
		with WaapiClient() as client:
			print("\nConnected with exit Wwise Authoring.")
			audio_root = get_audio_root(client)
			print(f"[INFO] Root Path Detected: {audio_root}")
			master_folder_args = {
				"parent": audio_root,
				"type": "Folder",
				"name": "Footsteps",
				"onNameConflict": "merge"
			}
			client.call("ak.wwise.core.object.create", master_folder_args)
			footsteps_root = f"{audio_root}\\Footsteps"
			print (f"[OK] Folder created/verified in Wwise: {footsteps_root}")

			for folder in surface_folders:
				surface_name = folder.name
				wav_files=list(folder.glob("*.wav"))

				if not wav_files:
					print (f"\n [SKIP] {surface_name} doesn't contain any .wav file")
					continue
				print (f"\n Processing: {surface_name} ({len(wav_files)} files)")
				container_name = f"FS_{surface_name}"
				container_path = f"{footsteps_root}\\{container_name}"

				container_args={
					"parent": footsteps_root,
					"type": "RandomSequenceContainer",
					"name": container_name,
					"onNameConflict": "merge"
                }
				container_res=client.call("ak.wwise.core.object.create", container_args)
				container_id=container_res.get("id")
				print (f"[OK] Container created/verified: {container_name} (ID:{container_id})")

				import_entries=[]
				for wav in wav_files:
					import_entries.append({
						"audioFile": str(wav.resolve()),
						"objectPath": f"{container_path}\\<Sound>{wav.stem}"					
						})
				import_args={
					"importOperation": "createNew",
					"default": {
						"importLanguage": "SFX"},
						"imports": import_entries
				}
				import_res = client.call("ak.wwise.core.audio.import", import_args)
				imported_count = len(import_res.get("objects", []))
				print(f"[OK] {imported_count} files created in {container_name}")

				event_name= f"Play_{container_name}"
				event_args={
					"parent": r"\Events\Default Work Unit",
					"type": "Event",
					"name": event_name,
					"onNameConflict": "replace",
					"children": [
						{
							"name" : "",
							"type": "Action",
							"@ActionType": 1,
							"@Target": container_id
						}
					]
				}
				client.call("ak.wwise.core.object.create", event_args)
				print (f"[OK] Event created/verified: {event_name}")

	except CannotConnectToWaapiException:
		print("\n[ERROR] Unable to conncet to Wwise")
	except Exception as e:
		print(f"\n[ERROR]Something strange happened: {e}")
		
if __name__ == "__main__": 
	main()