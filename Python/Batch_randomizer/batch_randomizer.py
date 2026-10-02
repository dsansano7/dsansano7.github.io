"""
Wwise Batch Audio Randomizer
Author: Diego Sansano
    DESCRIPTION:
        Workflow utility designed to prevent auditory fatigue across game audio assets.
        It scans selected containers in Wwise and automatically configures pitch and volume 
        randomizers within humanized, production-standard thresholds via WAAPI.

    HOW TO USE:
        1. Open your Wwise project (ensure WAAPI is enabled under Project > User Settings).
        2. In Wwise, select one or more containers (Random/Sequence, Blend, etc.) in the Actor-Mixer.
        3. Run: python wwise_batch_randomizer.py
"""

from waapi import WaapiClient, CannotConnectToWaapiException


def set_property_randomizer(client, object_id: str, property_name: str, min_val: float, max_val: float):
    """Enables and assigns min/max variation bounds to a specific property."""
    client.call("ak.wwise.core.object.setRandomizer", {
        "object": object_id,
        "property": property_name,
        "enabled": True,
        "min": min_val,
        "max": max_val
    })


def main():
    PITCH_MIN, PITCH_MAX = -50.0, 50.0
    VOLUME_MIN, VOLUME_MAX = -1.2, 0.8

    try:
        with WaapiClient() as client:
            print("[OK] Connected successfully to Wwise Authoring.")

            selected_res = client.call(
                "ak.wwise.ui.getSelectedObjects",
                options={"return": ["id", "name", "type"]}
            )
            selected_objects = selected_res.get("objects", [])

            if not selected_objects:
                print("[WARNING] No objects selected. Select containers in Wwise and run again.")
                return

            print(f"[INFO] Processing {len(selected_objects)} selected object(s)...")

            updated_count = 0
            for obj in selected_objects:
                obj_id = obj["id"]
                obj_name = obj["name"]

                set_property_randomizer(client, obj_id, "Pitch", PITCH_MIN, PITCH_MAX)
                set_property_randomizer(client, obj_id, "Volume", VOLUME_MIN, VOLUME_MAX)

                print(f"  [OK] Randomizers applied to -> {obj_name}")
                updated_count += 1

            print(f"\n[SUCCESS] Successfully randomized parameters on {updated_count} object(s).")

    except CannotConnectToWaapiException:
        print("\n[ERROR] Unable to connect to Wwise.")
        print("Ensure Wwise Authoring is open with WAAPI enabled under User Preferences.")
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()