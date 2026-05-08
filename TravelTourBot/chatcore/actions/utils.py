import json
import os
import random
import re
import requests
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TOUR_DATA_PATH = os.path.join(CORE_DIR, "data", "tours.json")

# API URL cho backend - có thể cấu hình qua biến môi trường
API_BASE_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000")
TOURS_API_URL = f"{API_BASE_URL}/api/tours"

MONTH_WORDS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
    "thang mot": 1,
    "thang hai": 2,
    "thang ba": 3,
    "thang tu": 4,
    "thang nam": 5,
    "thang sau": 6,
    "thang bay": 7,
    "thang tam": 8,
    "thang chin": 9,
    "thang muoi": 10,
    "thang muoi mot": 11,
    "thang muoi hai": 12
}


def strip_accents(text: str) -> str:
    normalized = text.lower()
    mapping = {
        "[àáạảãâầấậẩẫăằắặẳẵ]": "a",
        "[èéẹẻẽêềếệểễ]": "e",
        "[ìíịỉĩ]": "i",
        "[òóọỏõôồốộổỗơờớợởỡ]": "o",
        "[ùúụủũưừứựửữ]": "u",
        "[ỳýỵỷỹ]": "y",
        "[đ]": "d"
    }
    for pattern, replacement in mapping.items():
        normalized = re.sub(pattern, replacement, normalized)
    return normalized


# Danh sách điểm đến tĩnh (không dấu) để bắt nhanh các tỉnh/thành khi NLU không gắn entity.
# Gồm các key phổ biến và toàn bộ tỉnh/thành Việt Nam (kể cả Phú Quốc).
STATIC_DESTINATION_KEYWORDS = [
    "sapa",
    "ha long",
    "ha noi",
    "thanh pho ho chi minh",
    "tp hcm",
    "sai gon",
    "da nang",
    "hoi an",
    "phu quoc",
    "thai lan",
    "bangkok",
    "pattaya",
    "nhat ban",
    "tokyo",
    "kyoto",
    # Miền Bắc
    "ha giang",
    "cao bang",
    "lang son",
    "bac kan",
    "tuyen quang",
    "thai nguyen",
    "phu tho",
    "vinh phuc",
    "bac giang",
    "bac ninh",
    "hai duong",
    "hung yen",
    "ha nam",
    "nam dinh",
    "thai binh",
    "ninh binh",
    "quang ninh",
    "haiphong",
    "hai phong",
    "yen bai",
    "lao cai",
    "son la",
    "dien bien",
    "lai chau",
    "hoa binh",
    # Miền Trung
    "thanh hoa",
    "nghe an",
    "ha tinh",
    "quang binh",
    "quang tri",
    "thua thien hue",
    "da nang",
    "quang nam",
    "quang ngai",
    "binh dinh",
    "gia lai",
    "kon tum",
    "dak lak",
    "dak nong",
    "lam dong",
    "da lat",
    "phan thiet",
    "binh thuan",
    "ninh thuan",
    "phu yen",
    "khanh hoa",
    "nha trang",
    # Miền Nam
    "binh phuoc",
    "binh duong",
    "dong nai",
    "tay ninh",
    "ba ria vung tau",
    "vung tau",
    "long an",
    "tien giang",
    "ben tre",
    "tra vinh",
    "vinh long",
    "dong thap",
    "an giang",
    "kien giang",
    "can tho",
    "hau giang",
    "soc trang",
    "bac lieu",
    "ca mau",
]


def _load_destination_keywords_from_api() -> List[str]:
    """Lấy danh sách keywords từ API backend thay vì file JSON."""
    try:
        # Gọi API với limit lớn để lấy tất cả tours
        response = requests.get(
            TOURS_API_URL,
            params={"limit": 1000, "page": 1},
            timeout=10
        )
        if response.status_code != 200:
            return []
        
        data = response.json()
        if not data.get("success") or not data.get("data"):
            return []
        
        tours = data.get("data", [])
        keywords: List[str] = []
        for tour in tours:
            destination = tour.get("destination", "")
            if not destination:
                continue
            normalized = strip_accents(destination)
            # Tách theo dấu phẩy, gạch ngang hoặc dấu gạch đứng
            for part in re.split(r"[,/\\|-]", normalized):
                candidate = part.strip()
                if candidate:
                    keywords.append(candidate)
        return keywords
    except (requests.RequestException, json.JSONDecodeError, KeyError):
        return []


def _load_destination_keywords_from_file() -> List[str]:
    """Fallback: Lấy từ file JSON nếu API không khả dụng."""
    if not os.path.exists(TOUR_DATA_PATH):
        return []
    try:
        with open(TOUR_DATA_PATH, "r", encoding="utf-8") as file:
            tours = json.load(file)
    except (json.JSONDecodeError, OSError):
        return []

    keywords: List[str] = []
    for tour in tours:
        destination = tour.get("destination", "")
        normalized = strip_accents(destination)
        # Tách theo dấu phẩy, gạch ngang hoặc dấu gạch đứng
        for part in re.split(r"[,/\\|-]", normalized):
            candidate = part.strip()
            if candidate:
                keywords.append(candidate)
    return keywords


def _build_destination_keywords() -> List[str]:
    keywords = set(STATIC_DESTINATION_KEYWORDS)
    # Ưu tiên lấy từ API, fallback về file nếu API lỗi
    api_keywords = _load_destination_keywords_from_api()
    if api_keywords:
        for keyword in api_keywords:
            keywords.add(keyword)
    else:
        # Fallback về file JSON nếu API không khả dụng
        for keyword in _load_destination_keywords_from_file():
            keywords.add(keyword)
    return sorted(keywords)


DESTINATION_KEYWORDS = _build_destination_keywords()


def parse_destinations(question: str) -> List[str]:
    normalized = strip_accents(question)
    matches = []
    for keyword in DESTINATION_KEYWORDS:
        if keyword in normalized:
            matches.append(keyword.title())
    return matches


def parse_budget(question: str) -> Optional[Tuple[int, int]]:
    normalized = strip_accents(question)
    numbers = re.findall(r"(\d+[.,]?\d*)\s*(trieu|tr|trd|k|nghin|vnd|dong)?", normalized)
    if not numbers:
        return None

    parsed_values = []
    for raw_value, unit in numbers:
        value = float(raw_value.replace(",", "."))
        unit = unit or ""
        if unit in ["trieu", "tr", "trd"]:
            parsed_values.append(int(value * 1_000_000))
        elif unit in ["k", "nghin"]:
            parsed_values.append(int(value * 1_000))
        else:
            parsed_values.append(int(value))

    parsed_values.sort()
    if len(parsed_values) == 1:
        return (0, parsed_values[0])
    return (parsed_values[0], parsed_values[-1])


def parse_month(question: str) -> Optional[int]:
    normalized = strip_accents(question)
    number_match = re.search(r"thang\s*(\d{1,2})", normalized)
    if number_match:
        month = int(number_match.group(1))
        if 1 <= month <= 12:
            return month

    for key, value in MONTH_WORDS.items():
        if key in normalized:
            return value
    return None

def _map_api_tour_to_chatbot_format(api_tour: Dict[str, Any]) -> Dict[str, Any]:
    """Chuyển đổi dữ liệu tour từ API response sang format mà chatbot đang dùng."""
    # Map các trường từ API response sang format JSON hiện tại
    mapped_tour = {
        "id": str(api_tour.get("id", "")),
        "tour_code": api_tour.get("tour_code", ""),
        "title": api_tour.get("title", ""),
        "description": api_tour.get("description", ""),
        "destination": api_tour.get("destination", ""),
        "departure": api_tour.get("departure", ""),
        "start_date": api_tour.get("start_date", ""),
        "end_date": api_tour.get("end_date", ""),
        "duration": api_tour.get("duration", ""),
        "price": float(api_tour.get("price", 0)),
        "capacity": api_tour.get("capacity", 0),
        "ticket_solded": api_tour.get("ticket_solded", 0),
        "rating": float(api_tour.get("rating", 0)) if api_tour.get("rating") else None,
        "total_reviews": api_tour.get("total_reviews", 0),
        "latitude": float(api_tour.get("latitude", 0)),
        "longitude": float(api_tour.get("longitude", 0)),
        "main_image": api_tour.get("main_image", ""),
        "is_active": api_tour.get("is_active", True),
        "created_at": api_tour.get("created_at", ""),
        "updated_at": api_tour.get("updated_at", ""),
    }
    return mapped_tour



def load_tours() -> List[Dict[str, Any]]:
    """Lấy danh sách tours từ API backend thay vì file JSON."""
    try:
        # Gọi API với limit lớn để lấy tất cả tours
        response = requests.get(
            TOURS_API_URL,
            params={"limit": 1000, "page": 1},
            timeout=10
        )
        
        if response.status_code != 200:
            # Fallback về file JSON nếu API lỗi
            return _load_tours_from_file()
        
        data = response.json()
        if not data.get("success") or not data.get("data"):
            # Fallback về file JSON nếu response không hợp lệ
            return _load_tours_from_file()
        
        api_tours = data.get("data", [])
        # Map dữ liệu từ API sang format chatbot đang dùng
        mapped_tours = [_map_api_tour_to_chatbot_format(tour) for tour in api_tours]
        return mapped_tours
        
    except (requests.RequestException, json.JSONDecodeError, KeyError, ValueError) as e:
        # Log lỗi và fallback về file JSON
        print(f"⚠️ Lỗi khi gọi API tours: {e}. Đang sử dụng file JSON làm fallback.")
        return _load_tours_from_file()

def _load_tours_from_file() -> List[Dict[str, Any]]:
    """Fallback: Lấy tours từ file JSON nếu API không khả dụng."""
    if not os.path.exists(TOUR_DATA_PATH):
        return []
    try:
        with open(TOUR_DATA_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []

def _parse_iso_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None


def _compute_seats_left(tour: Dict[str, Any]) -> Optional[int]:
    capacity = tour.get("capacity")
    sold = tour.get("ticket_solded", 0)
    if capacity is None:
        return None
    return max(int(capacity) - int(sold), 0)


def _filter_available_tours(tours: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    available: List[Dict[str, Any]] = []
    for tour in tours:
        if not tour.get("is_active", True):
            continue
        seats_left = _compute_seats_left(tour)
        if seats_left is not None and seats_left <= 0:
            continue
        tour_copy = {**tour}
        if seats_left is not None:
            tour_copy["seats_left"] = seats_left
        available.append(tour_copy)
    return available


def _is_month_available(month: int, tour: Dict[str, Any]) -> bool:
    start = _parse_iso_date(tour.get("start_date"))
    end = _parse_iso_date(tour.get("end_date"))
    if not start or not end:
        return True
    start_month = start.month
    end_month = end.month
    if start.year == end.year and start_month <= end_month:
        return start_month <= month <= end_month
    if start_month <= end_month:
        return start_month <= month <= end_month
    return month >= start_month or month <= end_month


def recommend_tours(
    count: int = 1,
    destinations: Optional[List[str]] = None,
    budget_range: Optional[Tuple[int, int]] = None,
    travel_month: Optional[int] = None,
) -> List[Dict[str, Any]]:
    tours_data = _filter_available_tours(load_tours())

    filtered = tours_data
    if destinations:
        normalized_dest = [strip_accents(dest) for dest in destinations]
        filtered = [
            tour
            for tour in filtered
            if strip_accents(tour["destination"]) in normalized_dest
            or any(dest in strip_accents(tour["title"]) for dest in normalized_dest)
        ]
        # Nếu có yêu cầu điểm đến mà không tìm thấy, trả rỗng để caller tự xử lý
        if not filtered:
            return []

    if budget_range:
        min_budget, max_budget = budget_range
        filtered = [
            tour
            for tour in filtered
            if min_budget <= tour.get("price", 0) <= max_budget
        ]

    if travel_month:
        filtered = [
            tour for tour in filtered if _is_month_available(travel_month, tour)
        ]

    # Chỉ fallback khi filter theo destinations hoặc travel_month, không fallback khi filter budget
    # Vì nếu filter budget mà không tìm thấy tour phù hợp, nên trả về empty để caller hiển thị message phù hợp
    if not filtered and not budget_range:
        filtered = tours_data

    random.shuffle(filtered)
    return filtered[:count]