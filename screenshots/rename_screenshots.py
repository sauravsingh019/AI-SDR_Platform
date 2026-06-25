import os
import shutil

dir_path = os.path.dirname(os.path.abspath(__file__))

mapping = {
    "Screenshot 2026-06-25 120933.png": "login_page_screenshot.png",
    "Screenshot 2026-06-25 120950.png": "dashboard_screenshot.png",
    "Screenshot 2026-06-25 120957.png": "leads_page_screenshot.png",
    "Screenshot 2026-06-25 121004.png": "lead_detail_modal_screenshot.png",
    "Screenshot 2026-06-25 121011.png": "campaigns_screenshot.png",
}

for src, dest in mapping.items():
    src_path = os.path.join(dir_path, src)
    dest_path = os.path.join(dir_path, dest)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Copied: {src} -> {dest}")
    else:
        print(f"Skipped (Not Found): {src}")
