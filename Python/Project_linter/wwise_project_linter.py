"""
Wwise Project QA Linter & Validator
Author: Diego Sansano
    DESCRIPTION:
        Quality assurance utility that scans selected audio objects in Wwise
        to catch common human errors before SoundBank generation or Git commits.
        Checks for invalid Master Bus routing and unassigned 3D attenuation curves.

    HOW TO USE:
        1. Open your Wwise project (ensure WAAPI is enabled under Project > User Settings).
        2. In Wwise, select one or more objects in the Actor-Mixer Hierarchy.
        3. Run: python wwise_project_linter.py
"""

from waapi import WaapiClient, CannotConnectToWaapiException


def main():
    try:
        with WaapiClient() as client:
            print("[OK] Connected successfully to Wwise Authoring.")


            selected_res = client.call(
                "ak.wwise.ui.getSelectedObjects",
                options={
                    "return": [
                        "id",
                        "name",
                        "type",
                        "path",
                        "outputBus",
                        "positioning:3D:attenuation"
                    ]
                }
            )
            selected_objects = selected_res.get("objects", [])

            if not selected_objects:
                print("[WARNING] No objects selected. Select audio objects in Wwise and run again.")
                return

            print(f"[INFO] Auditing {len(selected_objects)} object(s)...\n" + "-" * 50)

            issues_found = 0


            for obj in selected_objects:
                obj_name = obj.get("name")
                obj_type = obj.get("type")
                bus_info = obj.get("outputBus")
                attenuation_info = obj.get("positioning:3D:attenuation")

                if bus_info:
                    bus_name = bus_info.get("name", "")
                    if bus_name in ["Master Audio Bus", ""]:
                        print(f"[FAIL] Routing Issue: '{obj_name}' ({obj_type})")
                        print(f"       -> Routed directly to '{bus_name or 'None'}'. Assign a proper Sub-Bus.")
                        issues_found += 1

                if attenuation_info is not None and not attenuation_info.get("id"):
                    print(f"[FAIL] Spatial Audio Issue: '{obj_name}' ({obj_type})")
                    print("       -> 3D positioning enabled without an Attenuation curve assigned.")
                    issues_found += 1

            print("-" * 50)
            if issues_found == 0:
                print("[PASS] All selected objects comply with project standards.")
            else:
                print(f"[WARNING] Audit complete: {issues_found} issue(s) detected. Fix before committing.")

    except CannotConnectToWaapiException:
        print("\n[ERROR] Unable to connect to Wwise.")
        print("Ensure Wwise Authoring is open with WAAPI enabled under User Preferences.")
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()