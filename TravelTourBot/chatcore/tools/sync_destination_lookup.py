from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Dict, Any, List


def _load_tourist_data() -> Dict[str, Dict[str, Any]]:
    """Import dữ liệu từ file đia_diem_du_lich.py và trả về dict TOURIST_PLACES_BY_PROVINCE."""
    base_dir = Path(__file__).resolve().parents[1]  # chatcore
    data_path = base_dir / "data" / "đia_diem_du_lich.py"
    if not data_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu: {data_path}")

    spec = importlib.util.spec_from_file_location("tourist_locations", str(data_path))
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    assert spec and spec.loader
    spec.loader.exec_module(module)  # type: ignore[attr-defined]

    return getattr(module, "TOURIST_PLACES_BY_PROVINCE", {})


def _normalize_sort_key(value: str) -> str:
    """Khóa sort đơn giản để danh sách ổn định (không bỏ dấu để giữ nguyên hiển thị)."""
    return value.lower()


def build_destination_list() -> List[str]:
    tourist_data = _load_tourist_data()
    names: List[str] = []
    seen = set()

    for payload in tourist_data.values():
        for place in payload.get("places", []):
            name = place.get("name")
            if not name:
                continue
            if name in seen:
                continue
            seen.add(name)
            names.append(name)

    names.sort(key=_normalize_sort_key)
    return names


def update_nlu_lookup() -> None:
    base_dir = Path(__file__).resolve().parents[1]  # chatcore
    nlu_path = base_dir / "data" / "nlu.yml"
    if not nlu_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file NLU: {nlu_path}")

    lines = nlu_path.read_text(encoding="utf-8").splitlines()
    start_idx = None

    for idx, line in enumerate(lines):
        if line.strip().startswith("- lookup: destination"):
            start_idx = idx
            break

    if start_idx is None:
        raise RuntimeError("Không tìm thấy block '- lookup: destination' trong nlu.yml")

    # Tìm điểm kết thúc block hiện tại (dòng bắt đầu bằng '  - ' tiếp theo)
    end_idx = len(lines)
    for idx in range(start_idx + 1, len(lines)):
        line = lines[idx]
        if line.startswith("  - ") and not line.strip().startswith("- lookup: destination"):
            end_idx = idx
            break

    destinations = build_destination_list()

    new_block: List[str] = []
    new_block.append("  - lookup: destination")
    new_block.append("    examples: |")
    for name in destinations:
        new_block.append(f"      - {name}")

    updated_lines = lines[:start_idx] + new_block + lines[end_idx:]
    nlu_path.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    update_nlu_lookup()
    print("Đã đồng bộ lookup 'destination' trong nlu.yml từ đia_diem_du_lich.py.")


