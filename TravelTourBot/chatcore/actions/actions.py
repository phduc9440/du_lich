import importlib.util
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Text

from rasa_sdk import Action, FormValidationAction, Tracker
from rasa_sdk.events import SlotSet
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.types import DomainDict

from . import utils


class ActionLogUnknownQuestion(Action):
    def name(self) -> Text:
        return "action_log_unknown_question"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        """Ghi log các câu hỏi mà bot chưa hiểu rõ để training lại sau."""
        import json

        text = tracker.latest_message.get("text", "")
        intent = tracker.latest_message.get("intent", {}).get("name")
        entities = tracker.latest_message.get("entities", [])
        slots = tracker.current_slot_values()

        log_record = {
            "text": text,
            "intent": intent,
            "entities": entities,
            "slots": slots,
        }

        log_path = (
            Path(__file__).resolve().parent.parent / "data" / "unknown_questions.jsonl"
        )
        try:
            with log_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(log_record, ensure_ascii=False) + "\n")
        except OSError:
            pass

        dispatcher.utter_message(
            text="TravelTour chưa hiểu rõ câu này, bạn có thể nói lại rõ hơn về điểm đến hoặc nhu cầu của mình được không ạ?"
        )
        return []


def _fallback_provinces_from_text(text: Optional[str]) -> List[str]:
    """
    Dò tỉnh/thành từ câu hỏi bằng cách soi qua toàn bộ dữ liệu trong `dia_diem_du_lich`.
    """
    normalized = _normalize_text(text)
    if not normalized:
        return []

    _ensure_tourist_data_loaded()
    
    # Access global variable directly to avoid import issues
    global TOURIST_DATA
    matched: List[str] = []
    for province_key, payload in TOURIST_DATA.items():
        display_name = payload.get("display_name", province_key)
        # Sử dụng normalized_aliases đã được tính toán sẵn
        normalized_aliases = payload.get("normalized_aliases", [])
        
        for alias in normalized_aliases:
            if not alias:
                continue
            # Kiểm tra cả exact match và substring match
            if alias == normalized or alias in normalized or normalized in alias:
                matched.append(display_name)
                break

    return matched


TOURIST_DATA: Dict[str, Dict[str, Any]] = {}
PLACE_INDEX: Dict[str, Dict[str, Text]] = {}
SPECIALTY_DATA: Dict[str, Dict[str, Any]] = {}
SPECIALTY_INDEX: Dict[str, Dict[str, Text]] = {}

# Cache cho _normalize_text để tối ưu performance
_NORMALIZE_CACHE: Dict[str, str] = {}


def _normalize_text(value: Optional[str]) -> str:
    """Normalize text với caching để tối ưu performance."""
    if not value:
        return ""
    
    # Kiểm tra cache trước
    if value in _NORMALIZE_CACHE:
        return _NORMALIZE_CACHE[value]
    
    ascii_text = (
        unicodedata.normalize("NFD", value)
        .encode("ascii", "ignore")
        .decode("utf-8")
        .lower()
        .strip()
    )
    result = re.sub(r"\s+", " ", ascii_text)
    
    # Lưu vào cache (giới hạn cache size để tránh memory leak)
    if len(_NORMALIZE_CACHE) < 10000:
        _NORMALIZE_CACHE[value] = result
    
    return result


def _add_destination_to_list(
    value: Optional[str],
    destinations: List[str],
    normalized_seen: Set[str]
) -> None:
    """
    Helper function để thêm destination vào list, tránh trùng lặp.
    Được extract từ các action classes để tái sử dụng.
    """
    if not value:
        return
    normalized_value = utils.strip_accents(str(value)).strip()
    if not normalized_value or normalized_value in normalized_seen:
        return
    destinations.append(str(value))
    normalized_seen.add(normalized_value)


def _events_when_province_changes(
    current_province: Optional[str], new_province: Optional[str]
) -> List[Dict[Text, Any]]:
    """
    Nếu phát hiện tỉnh mới khác tỉnh đang giữ trong slot, xoá bớt ngữ cảnh cũ.
    """
    events: List[Dict[Text, Any]] = []
    if not new_province:
        return events
    current_norm = _normalize_text(current_province)
    new_norm = _normalize_text(new_province)
    if current_norm and current_norm == new_norm:
        events.append(SlotSet("province", new_province))
        return events

    for slot_name in ["destination", "travel_theme", "budget_range", "travel_month"]:
        events.append(SlotSet(slot_name, None))
    events.append(SlotSet("province", new_province))
    return events


def _ensure_tourist_data_loaded() -> None:
    global TOURIST_DATA, PLACE_INDEX
    if TOURIST_DATA:
        return

    data_path = (
        Path(__file__).resolve().parent.parent / "data" / "đia_diem_du_lich.py"
    )
    if not data_path.exists():
        TOURIST_DATA = {}
        PLACE_INDEX = {}
        return
    
    try:
        spec = importlib.util.spec_from_file_location("tourist_locations", str(data_path))
        module = importlib.util.module_from_spec(spec)
        if spec and spec.loader:
            spec.loader.exec_module(module)
        else:
            raise RuntimeError("Không thể tải dữ liệu địa điểm du lịch.")

        TOURIST_DATA = getattr(module, "TOURIST_PLACES_BY_PROVINCE", {})
        PLACE_INDEX = {}
        for province_key, payload in TOURIST_DATA.items():
            display_name = payload.get("display_name", province_key)
            places = payload.get("places", [])
            normalized_aliases = {_normalize_text(display_name)}
            for alias in payload.get("aliases", []):
                normalized_aliases.add(_normalize_text(alias))
            payload["normalized_aliases"] = list(filter(None, normalized_aliases))
            for place in places:
                name = place.get("name")
                if not name:
                    continue
                PLACE_INDEX[_normalize_text(name)] = {
                    "name": name,
                    "address": place.get("address", "Đang cập nhật"),
                    "district": place.get("district", ""),  # Thêm district
                    "province": display_name,
                    "province_key": province_key,
                }
        
    except Exception as e:
        # Log error but don't print to avoid console issues in production
        TOURIST_DATA = {}
        PLACE_INDEX = {}


def _ensure_specialty_data_loaded() -> None:
    global SPECIALTY_DATA, SPECIALTY_INDEX
    if SPECIALTY_DATA:
        return

    data_path = (
        Path(__file__).resolve().parent.parent / "data" / "dac_san_tung_noi.py"
    )
    if not data_path.exists():
        SPECIALTY_DATA = {}
        SPECIALTY_INDEX = {}
        return
    spec = importlib.util.spec_from_file_location("specialty_data", str(data_path))
    module = importlib.util.module_from_spec(spec)
    if spec and spec.loader:
        spec.loader.exec_module(module)
    else:
        raise RuntimeError("Không thể tải dữ liệu đặc sản.")

    SPECIALTY_DATA = getattr(module, "SPECIALTIES_BY_PROVINCE", {})
    SPECIALTY_INDEX = {}
    for province_key, payload in SPECIALTY_DATA.items():
        display_name = payload.get("display_name", province_key)
        items = payload.get("items", [])
        normalized_aliases = {_normalize_text(display_name)}
        for alias in payload.get("aliases", []):
            normalized_aliases.add(_normalize_text(alias))
        payload["normalized_aliases"] = list(filter(None, normalized_aliases))
        for item in items:
            name = item.get("name")
            if not name:
                continue
            SPECIALTY_INDEX[_normalize_text(name)] = {
                "name": name,
                "address": item.get("address", "Đang cập nhật"),
                "district": item.get("district", ""),
                "related_locations": item.get("related_locations", []),
                "province": display_name,
                "province_key": province_key,
            }


def _find_place(place_name: Optional[str]) -> Optional[Dict[str, Text]]:
    if not place_name:
        return None
    _ensure_tourist_data_loaded()
    
    # Access global variable directly to avoid import issues
    global PLACE_INDEX
    normalized = _normalize_text(place_name)
    if normalized in PLACE_INDEX:
        return PLACE_INDEX[normalized]
    for key, info in PLACE_INDEX.items():
        if normalized in key:
            return info
    return None


def _match_province_name(
    normalized: str,
    payload: Dict[str, Any],
    check_display_name: bool = False,
    check_aliases: bool = False
) -> bool:
    """
    Helper function để kiểm tra xem normalized name có match với province payload không.
    Tái sử dụng logic chung cho cả _resolve_province và _resolve_specialty_province.
    """
    # Kiểm tra normalized_aliases (đã được tính toán sẵn)
    normalized_aliases = payload.get("normalized_aliases", [])
    for alias_norm in normalized_aliases:
        if alias_norm and (normalized == alias_norm or normalized in alias_norm or alias_norm in normalized):
            return True
    
    if check_display_name:
        display_name = payload.get("display_name", "")
        if display_name and normalized == _normalize_text(display_name):
            return True
    
    if check_aliases:
        aliases = payload.get("aliases", [])
        for alias in aliases:
            if alias and normalized == _normalize_text(alias):
                return True
    
    return False


def _resolve_province(province_name: Optional[str]) -> Optional[Dict[str, Any]]:
    """Resolve province từ TOURIST_DATA."""
    if not province_name:
        return None
    _ensure_tourist_data_loaded()
    
    # Access global variable directly to avoid import issues
    global TOURIST_DATA
    normalized = _normalize_text(province_name)
    for province_key, payload in TOURIST_DATA.items():
        if _match_province_name(normalized, payload):
            return {"key": province_key, **payload}
    return None


def _get_places_for_province(province_payload: Dict[str, Any], limit: int = 5) -> List[Dict[str, Text]]:
    places = province_payload.get("places", [])
    return places[:limit]


THEME_KEYWORDS = {
    "bien": ["biển", "bãi", "vịnh", "đảo", "hòn", "cù lao", "cát", "mũi né", "mũi"],
    "tam_linh": ["chùa", "đền", "miếu", "phủ", "nhà thờ", "thánh", "thờ"],
    "lich_su": [
        "bảo tàng",
        "lăng",
        "thành",
        "nhà tù",
        "di tích",
        "cổ đô",
        "thành cổ",
        "địa đạo",
    ],
    "lang_nghe": ["làng", "làng nghề", "phố nghề", "làng gốm", "làng hoa", "làng chài"],
    "thien_nhien": ["thác", "núi", "hồ", "rừng", "hang", "đèo", "thung", "cánh đồng"],
    "hang_dong": ["hang", "động", "thạch nhũ", "hang động"],
    "trekking": ["trek", "trekking", "leo núi", "hiking", "phượt"],
    "camping": ["camp", "cắm trại", "camping", "dã ngoại", "lều", "trại"],
    "san_may": ["săn mây", "săn mù", "view mây", "san may"],
    "suoi_khoang": ["suối khoáng", "suối nóng", "suối nước nóng", "on sen"],
    "sinh_thai": ["sinh thái", "ecotour", "eco"],
    "mao_hiem": ["mạo hiểm", "zipline", "chèo thuyền", "rafting", "kayak"],
    "nghi_duong": ["nghỉ dưỡng", "resort", "wellness", "spa"],
    "checkin": ["check-in", "checkin", "chụp ảnh", "sống ảo"],
    "vuon_quoc_gia": ["vườn quốc gia", "national park"],
    "pho_co": ["phố cổ", "old town"],
    "lang_que": ["làng quê", "countryside"],
}

THEME_ALIASES = {
    "bien": {"bien", "bai bien", "dao", "vung", "vinh", "hon", "cat", "mui", "cang bien"},
    "tam_linh": {"chua", "den", "mieu", "phu", "nha tho", "tam linh"},
    "lich_su": {"lich su", "history", "di tich", "bao tang", "thanh co", "dia dao"},
    "lang_nghe": {"lang nghe", "lang nghe truyen thong", "pho nghe"},
    "thien_nhien": {"thien nhien", "nature", "thac nuoc", "nui", "ho", "rung"},
    "hang_dong": {"hang dong", "dong", "hang", "cave"},
    "trekking": {"trekking", "trek", "leo nui", "hiking", "phuot"},
    "camping": {"camping", "cam trai", "da ngoai", "leu trai"},
    "san_may": {"san may", "san mu", "view may"},
    "suoi_khoang": {"suoi khoang", "suoi nuoc nong", "on sen"},
    "sinh_thai": {"sinh thai", "eco", "ecotour"},
    "mao_hiem": {"mao hiem", "zipline", "rafting", "kayak", "mạo hiểm"},
    "nghi_duong": {"nghi duong", "resort", "wellness", "spa"},
    "checkin": {"check-in", "checkin", "song ao", "chup anh"},
    "vuon_quoc_gia": {"vuon quoc gia", "national park"},
    "pho_co": {"pho co", "old town"},
    "lang_que": {"lang que", "countryside"},
}


def _filter_places_by_theme(
    theme: str, province_key: Optional[str] = None, limit: int = 5
) -> List[Dict[str, Text]]:
    _ensure_tourist_data_loaded()
    normalized_theme = _normalize_text(theme)
    theme_key = "thien_nhien"
    for key, aliases in THEME_ALIASES.items():
        if normalized_theme in aliases:
            theme_key = key
            break

    keywords = THEME_KEYWORDS.get(theme_key, [])
    candidates: List[Dict[str, Text]] = []

    provinces = [province_key] if province_key else list(TOURIST_DATA.keys())
    for key in provinces:
        payload = TOURIST_DATA.get(key)
        if not payload:
            continue
        for place in payload.get("places", []):
            name = place.get("name", "")
            lower_name = name.lower()
            if any(keyword in lower_name for keyword in keywords):
                candidates.append(
                    {
                        "name": name,
                        "address": place.get("address", "Đang cập nhật"),
                        "province": payload.get("display_name", key),
                    }
                )
            if len(candidates) >= limit:
                return candidates
    return candidates[:limit]


def _find_specialty(name: Optional[str]) -> Optional[Dict[str, Text]]:
    if not name:
        return None
    _ensure_specialty_data_loaded()
    normalized = _normalize_text(name)
    if normalized in SPECIALTY_INDEX:
        return SPECIALTY_INDEX[normalized]
    for key, info in SPECIALTY_INDEX.items():
        if normalized in key:
            return info
    return None


def _get_specialties_by_province(province: Optional[str], limit: int = 5) -> List[Dict[str, Text]]:
    _ensure_specialty_data_loaded()
    payload = _resolve_specialty_province(province)
    if not payload:
        return []
    return payload.get("items", [])[:limit]


def _resolve_specialty_province(province_name: Optional[str]) -> Optional[Dict[str, Any]]:
    """Resolve province từ SPECIALTY_DATA với logic matching chi tiết hơn."""
    if not province_name:
        return None
    _ensure_specialty_data_loaded()
    normalized = _normalize_text(province_name)
    if not normalized:
        return None
    
    for province_key, payload in SPECIALTY_DATA.items():
        # Sử dụng helper function với các check bổ sung
        if _match_province_name(normalized, payload, check_display_name=True, check_aliases=True):
            return {"key": province_key, **payload}
    
    return None


def _find_specialties_by_place(place_name: str) -> List[Dict[str, Text]]:
    """
    Tìm đặc sản liên quan đến một địa điểm du lịch cụ thể
    Dựa vào district và related_locations
    """
    _ensure_tourist_data_loaded()
    _ensure_specialty_data_loaded()
    
    # Tìm thông tin địa điểm
    place_info = _find_place(place_name)
    if not place_info:
        return []
    
    place_district = place_info.get("district", "")
    place_province = place_info.get("province", "")
    place_name_exact = place_info.get("name", place_name)  # Dùng tên chính xác từ PLACE_INDEX
    
    # Normalize để so sánh
    place_name_normalized = _normalize_text(place_name_exact)
    
    matched_specialties = []
    
    # Tìm trong SPECIALTY_INDEX
    for spec_key, spec_info in SPECIALTY_INDEX.items():
        # Kiểm tra related_locations - normalize cả hai bên để so sánh
        related_locations = spec_info.get("related_locations", [])
        for related_loc in related_locations:
            # So sánh cả tên chính xác và normalized
            if (place_name_exact == related_loc or 
                place_name_normalized == _normalize_text(related_loc) or
                _normalize_text(place_name_exact) in _normalize_text(related_loc) or
                _normalize_text(related_loc) in place_name_normalized):
                matched_specialties.append(spec_info)
                break
        
        # Kiểm tra district nếu có
        if place_district and spec_info.get("district", "") == place_district:
            if spec_info.get("province", "") == place_province:
                # Tránh duplicate
                if spec_info not in matched_specialties:
                    matched_specialties.append(spec_info)
    
    return matched_specialties[:5]


def get_specialty_info(specialty_name: str) -> Optional[Dict[str, Text]]:
    """
    Lấy thông tin chi tiết của một món ăn đặc sản
    """
    return _find_specialty(specialty_name)


def get_location_for_specialty(specialty_name: str) -> List[Dict[str, Text]]:
    """
    Tìm địa điểm du lịch gắn với một món ăn đặc sản
    Trả về thông tin chi tiết bao gồm related_locations
    """
    specialty = _find_specialty(specialty_name)
    if not specialty:
        return []
    
    locations = []
    related_locations = specialty.get("related_locations", [])
    
    # Tìm thông tin chi tiết của các địa điểm liên quan
    for loc_name in related_locations:
        place_info = _find_place(loc_name)
        if place_info:
            locations.append({
                "name": place_info["name"],
                "address": place_info["address"],
                "district": place_info.get("district", ""),
                "province": place_info["province"],
                "type": "attraction"
            })
    
    # Nếu không có related_locations, tìm theo province và district
    if not locations:
        specialty_province = specialty.get("province", "")
        specialty_district = specialty.get("district", "")
        
        if specialty_province:
            locations.append({
                "name": specialty_province,
                "address": specialty.get("address", ""),
                "district": specialty_district,
                "province": specialty_province,
                "type": "province"
            })
    
    return locations


def get_specialties_by_location(location_query: str) -> Optional[Dict[str, Any]]:
    """
    Tìm kiếm đặc sản theo địa điểm (tỉnh/thành phố hoặc huyện/quận hoặc địa điểm cụ thể)
    """
    _ensure_specialty_data_loaded()
    _ensure_tourist_data_loaded()
    
    location_query_original = location_query
    location_query = location_query.lower().strip()
    
    # Loại bỏ các từ không quan trọng trong query để tìm địa điểm chính xác hơn
    stop_words = ["có", "những", "đặc", "sản", "nào", "gì", "ở", "tại", "của", "với", "liên", "quan", "đến", "đi", "là"]
    query_words_clean = [w for w in location_query.split() if w not in stop_words and len(w) > 1]
    location_query_clean = " ".join(query_words_clean).strip()
    
    # 0. ƯU TIÊN: Tìm trong LOCATION_TO_SPECIALTIES trước (mapping trực tiếp)
    data_path = (
        Path(__file__).resolve().parent.parent / "data" / "dac_san_tung_noi.py"
    )
    spec = importlib.util.spec_from_file_location("specialty_data", str(data_path))
    module = importlib.util.module_from_spec(spec)
    if spec and spec.loader:
        spec.loader.exec_module(module)
        LOCATION_TO_SPECIALTIES = getattr(module, "LOCATION_TO_SPECIALTIES", {})
        
        # Tìm exact match hoặc match tốt nhất trong LOCATION_TO_SPECIALTIES
        best_match = None
        best_score = 0
        
        query_normalized = _normalize_text(location_query_clean)
        
        for location_key, location_info in LOCATION_TO_SPECIALTIES.items():
            location_name_lower = location_info["name"].lower().strip()
            location_name_normalized = _normalize_text(location_info["name"])
            
            score = 0
            
            # Exact match sau khi normalize - ưu tiên cao nhất
            if query_normalized == location_name_normalized:
                score = 100
            elif location_name_normalized in query_normalized:
                score = 95
            elif query_normalized in location_name_normalized:
                score = 90
            # Match với từ khóa quan trọng
            else:
                important_keywords = ["kinh thành", "lăng", "chùa", "bãi biển", "vịnh", "đảo", "phố cổ"]
                for keyword in important_keywords:
                    keyword_normalized = _normalize_text(keyword)
                    if keyword_normalized in query_normalized and keyword_normalized in location_name_normalized:
                        score += 50
                        # Kiểm tra các từ còn lại
                        query_without_keyword = query_normalized.replace(keyword_normalized, "").strip()
                        location_without_keyword = location_name_normalized.replace(keyword_normalized, "").strip()
                        query_remaining = [w for w in query_without_keyword.split() if len(w) > 2]
                        location_remaining = [w for w in location_without_keyword.split() if len(w) > 2]
                        if query_remaining and location_remaining:
                            matched_remaining = sum(1 for qw in query_remaining if qw in location_remaining)
                            if matched_remaining > 0:
                                score += 30
                            else:
                                # Nếu không match từ còn lại, giảm điểm
                                score -= 20
                        break
            
            if score > best_score and score >= 50:
                best_match = location_info
                best_score = score
        
        if best_match:
            # Lấy thông tin specialties từ LOCATION_TO_SPECIALTIES
            specialty_names = best_match.get("specialties", [])
            specialties = []
            for spec_name in specialty_names:
                spec_info = _find_specialty(spec_name)
                if spec_info:
                    specialties.append(spec_info)
            
            if specialties:
                # Tìm place_info để có đầy đủ thông tin
                place_info = _find_place(best_match["name"])
                if not place_info:
                    # Tạo place_info từ LOCATION_TO_SPECIALTIES
                    place_info = {
                        "name": best_match["name"],
                        "address": best_match["location"],
                        "province": best_match["location"].split(",")[-1].strip() if "," in best_match["location"] else ""
                    }
                
                return {
                    "type": "attraction",
                    "location": {
                        "name": best_match["name"],
                        "location": best_match["location"],
                        "province": place_info.get("province", "")
                    },
                    "specialties": specialties
                }
            else:
                # Tìm thấy địa điểm nhưng không có specialties
                place_info = _find_place(best_match["name"])
                if not place_info:
                    place_info = {
                        "name": best_match["name"],
                        "address": best_match["location"],
                        "province": best_match["location"].split(",")[-1].strip() if "," in best_match["location"] else ""
                    }
                return {
                    "type": "attraction",
                    "location": {
                        "name": best_match["name"],
                        "location": best_match["location"],
                        "province": place_info.get("province", "")
                    },
                    "specialties": []
                }
    
    # 1. Tìm theo địa điểm du lịch cụ thể (fallback) - CHỈ khi không tìm thấy trong LOCATION_TO_SPECIALTIES
    place_info = _find_place(location_query_clean)
    if place_info:
        specialties = _find_specialties_by_place(place_info["name"])
        if specialties:
            return {
                "type": "attraction",
                "location": place_info,
                "specialties": specialties
            }
    
    # 2. Tìm theo district
    district_specialties = []
    district_province = None
    for province_key, province_info in SPECIALTY_DATA.items():
        for item in province_info["items"]:
            item_district = item.get("district", "").lower()
            if item_district and location_query in item_district:
                district_specialties.append(item)
                if not district_province:
                    district_province = province_info["display_name"]
    
    if district_specialties:
        return {
            "type": "district",
            "district_name": location_query,
            "province": district_province,
            "specialties": district_specialties[:5]
        }
    
    # 3. Tìm theo province
    location_query_normalized = _normalize_text(location_query_clean)
    for province_key, province_info in SPECIALTY_DATA.items():
        # Kiểm tra normalized_aliases (đã được tính toán sẵn)
        normalized_aliases = province_info.get("normalized_aliases", [])
        if location_query_normalized in normalized_aliases:
            return {
                "type": "province",
                "province": province_info,
                "specialties": province_info["items"][:5]
            }
        
        # Kiểm tra display_name
        display_name = province_info.get("display_name", "")
        if display_name:
            display_name_normalized = _normalize_text(display_name)
            if (location_query_normalized == display_name_normalized or
                location_query_normalized in display_name_normalized or
                display_name_normalized in location_query_normalized):
                return {
                    "type": "province",
                    "province": province_info,
                    "specialties": province_info["items"][:5]
                }
        
        # Kiểm tra aliases trực tiếp
        for alias in province_info.get("aliases", []):
            if alias:
                alias_normalized = _normalize_text(alias)
                if (location_query_normalized == alias_normalized or
                    location_query_normalized in alias_normalized or
                    alias_normalized in location_query_normalized):
                    return {
                        "type": "province",
                        "province": province_info,
                        "specialties": province_info["items"][:5]
                    }
        
        # Kiểm tra partial match với normalized_aliases
        for alias_norm in normalized_aliases:
            if alias_norm and (location_query_normalized in alias_norm or alias_norm in location_query_normalized):
                return {
                    "type": "province",
                    "province": province_info,
                    "specialties": province_info["items"][:5]
                }
    
    return None


def generate_specialty_response(query: str, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """
    Tạo phản hồi thông minh về đặc sản dựa trên câu hỏi và ngữ cảnh
    """
    query_lower = query.lower().strip()
    
    # Kiểm tra có phải hỏi về địa điểm của đặc sản không
    if any(keyword in query_lower for keyword in ["ở đâu", "địa điểm", "nơi nào", "tại đâu"]):
        # Tìm tên món ăn trong query
        _ensure_specialty_data_loaded()
        for province_key, province_info in SPECIALTY_DATA.items():
            for item in province_info["items"]:
                if item["name"].lower() in query_lower:
                    locations = get_location_for_specialty(item["name"])
                    response_lines = [f"Món {item['name']} là đặc sản của {item.get('province', '')}."]
                    
                    # Kiểm tra xem có related_locations không
                    related_locs = item.get("related_locations", [])
                    has_attraction_locations = any(loc.get("type") == "attraction" for loc in locations)
                    
                    if has_attraction_locations:
                        # Có related_locations -> hiển thị related_locations
                        response_lines.append("\nCác địa điểm du lịch liên quan:")
                        for loc in locations:
                            if loc["type"] == "attraction":
                                response_lines.append(f"- {loc['name']} ({loc['address']})")
                    else:
                        # Không có related_locations -> hiển thị district + address
                        if item.get("district"):
                            response_lines.append(f"Khu vực: {item['district']}, {item.get('address', '')}")
                        else:
                            response_lines.append(f"Địa chỉ: {item.get('address', '')}")
                    
                    return "\n".join(response_lines)
    
    # Tìm theo địa điểm
    location_result = get_specialties_by_location(query)
    if location_result:
        if location_result["type"] == "attraction":
            specialties = location_result["specialties"]
            location_info = location_result["location"]
            if specialties:
                specialty_list = "\n".join([
                    f"- {item['name']} ({item.get('district', '')}, {item.get('address', '')})"
                    for item in specialties
                ])
                return f"Đặc sản gắn với {location_info['name']} ({location_info.get('location', location_info.get('address', ''))}):\n{specialty_list}"
            else:
                # Tìm thấy địa điểm nhưng không có specialties
                return f"Hiện TravelTour chưa cập nhật thông tin đặc sản tại {location_info['name']} ({location_info.get('location', location_info.get('address', ''))})."
        
        elif location_result["type"] == "district":
            specialties = location_result["specialties"]
            specialty_list = "\n".join([
                f"- {item['name']} ({item.get('address', '')})"
                for item in specialties
            ])
            return f"Đặc sản tại {location_result['district_name']}, {location_result['province']}:\n{specialty_list}"
        
        elif location_result["type"] == "province":
            specialties = location_result["specialties"]
            specialty_list = "\n".join([
                f"- {item['name']} ({item.get('address', '')})"
                for item in specialties
            ])
            return f"Đặc sản bạn nên thử ở {location_result['province']['display_name']}:\n{specialty_list}"
    
    return None


def _format_tour_message(tour: Dict[str, Any], traveler_name: Optional[str]) -> str:
    greeting = (
        f"Dạ TravelTour gợi ý cho {traveler_name} tour sau:"
        if traveler_name
        else "Dạ TravelTour gợi ý tour sau:"
    )
    price_value = tour.get("price", 0)
    price_text = f"{price_value:,}đ".replace(",", ".")
    seats_left = tour.get("seats_left")
    rating = tour.get("rating")
    reviews = tour.get("total_reviews")
    description = tour.get("description", "")

    message_lines = [
        greeting,
        f"- Tour: {tour['title']} ({tour['duration']})",
        f"- Điểm đến: {tour['destination']} | Khởi hành: {tour.get('departure')}",
        f"- Giá dự kiến: {price_text}",
    ]
    if seats_left is not None:
        message_lines.append(f"- Còn lại: {seats_left} chỗ trống")
    if rating:
        reviews_text = f"{reviews} đánh giá" if reviews else "chưa có đánh giá"
        message_lines.append(f"- Đánh giá: {rating}★ ({reviews_text})")
    if description:
        message_lines.append(f"- Mô tả nhanh: {description}")
    return "\n".join(message_lines)


def _format_tour_message_no_header(tour: Dict[str, Any]) -> str:
    """Dùng khi ghép nhiều tour, bỏ dòng chào để tránh lặp."""
    price_value = tour.get("price", 0)
    price_text = f"{price_value:,}đ".replace(",", ".")
    seats_left = tour.get("seats_left")
    rating = tour.get("rating")
    reviews = tour.get("total_reviews")
    description = tour.get("description", "")

    message_lines = [
        f"- Tour: {tour['title']} ({tour['duration']})",
        f"  Điểm đến: {tour['destination']} | Khởi hành: {tour.get('departure')}",
        f"  Giá dự kiến: {price_text}",
    ]
    if seats_left is not None:
        message_lines.append(f"  Còn lại: {seats_left} chỗ trống")
    if rating:
        reviews_text = f"{reviews} đánh giá" if reviews else "chưa có đánh giá"
        message_lines.append(f"  Đánh giá: {rating}★ ({reviews_text})")
    if description:
        message_lines.append(f"  Mô tả nhanh: {description}")
    return "\n".join(message_lines)


class ActionRecommendGeneralTour(Action):
    def name(self) -> Text:
        return "action_recommend_general_tour"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        traveler_name = tracker.get_slot("traveler_name")
        destinations: List[str] = []
        normalized_seen: Set[str] = set()

        latest_entities = tracker.latest_message.get("entities", [])
        for entity in latest_entities:
            if entity.get("entity") in {"destination", "province"}:
                _add_destination_to_list(entity.get("value"), destinations, normalized_seen)

        _add_destination_to_list(tracker.get_slot("destination"), destinations, normalized_seen)
        _add_destination_to_list(tracker.get_slot("province"), destinations, normalized_seen)

        if not destinations:
            parsed = utils.parse_destinations(latest_message)
            destinations.extend(parsed)

        tour_list: List[Dict[str, Any]]
        if destinations:
            tour_list = utils.recommend_tours(1, destinations=destinations)
            if not tour_list:
                dest_text = ", ".join(destinations)
                dispatcher.utter_message(
                    text=f"Hiện chưa có tour phù hợp cho {dest_text}. Bạn muốn đổi địa điểm hoặc ngân sách không?"
                )
                return []
        else:
            tour_list = utils.recommend_tours(1)
            if not tour_list:
                dispatcher.utter_message(
                    text="Hiện TravelTour chưa có tour khả dụng, bạn vui lòng quay lại sau nhé!"
                )
                return []

        tour = tour_list[0]
        dispatcher.utter_message(
            text=_format_tour_message(tour, traveler_name),
            image=tour.get("main_image"),
        )
        events: List[Dict[Text, Any]] = []
        if destinations:
            events.append(SlotSet("last_destinations", ",".join(destinations)))
            events.append(SlotSet("province", destinations[0]))
        shown_titles_raw = tracker.get_slot("shown_tours") or ""
        shown_titles = {t for t in shown_titles_raw.split("||") if t}
        shown_titles.add(tour["title"])
        events.append(SlotSet("shown_tours", "||".join(shown_titles)))
        return events


class ActionRecommendPersonalizedTour(Action):
    def name(self) -> Text:
        return "action_recommend_personalized_tour"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        traveler_name = tracker.get_slot("traveler_name")
        intent_name = tracker.latest_message.get("intent", {}).get("name")
        destinations: List[str] = []
        normalized_seen: Set[str] = set()

        slot_destination = tracker.get_slot("destination")
        _add_destination_to_list(slot_destination, destinations, normalized_seen)

        latest_entities = tracker.latest_message.get("entities", [])
        for entity in latest_entities:
            if entity.get("entity") == "destination":
                _add_destination_to_list(entity.get("value"), destinations, normalized_seen)
            if entity.get("entity") == "province":
                _add_destination_to_list(entity.get("value"), destinations, normalized_seen)

        if not destinations:
            parsed = utils.parse_destinations(latest_message)
            destinations.extend(parsed)

        if not destinations and intent_name in {"ask_more_tours", "ask_list_tours"}:
            last_dest = tracker.get_slot("last_destinations")
            if last_dest:
                for part in last_dest.split(","):
                    _add_destination_to_list(part, destinations, normalized_seen)

        if not destinations:
            slot_province = tracker.get_slot("province")
            _add_destination_to_list(slot_province, destinations, normalized_seen)

        budget_range = utils.parse_budget(latest_message)
        travel_month = utils.parse_month(latest_message)

        if not destinations:
            dispatcher.utter_message(
                text="Bạn muốn đi địa điểm nào? TravelTour đang có tour biển, núi và cả nước ngoài!"
            )
            return []

        desired_count = 4 if intent_name in {"ask_more_tours", "ask_list_tours"} else 1
        tour_list = utils.recommend_tours(
            count=desired_count,
            destinations=destinations,
            budget_range=budget_range,
            travel_month=travel_month,
        )

        if not tour_list:
            dest_text = ", ".join(destinations)
            dispatcher.utter_message(
                text=f"Hiện chưa có tour phù hợp cho {dest_text}. Bạn muốn đổi địa điểm hoặc ngân sách không?"
            )
            return []

        events: List[Dict[Text, Any]] = []
        if destinations:
            events.append(SlotSet("last_destinations", ",".join(destinations)))
            if len(destinations) == 1:
                events.append(SlotSet("province", destinations[0]))

        shown_titles_raw = tracker.get_slot("shown_tours") or ""
        shown_titles = {t for t in shown_titles_raw.split("||") if t}
        fresh_tours = [t for t in tour_list if t["title"] not in shown_titles]

        if not fresh_tours:
            dest_text = ", ".join(destinations)
            dispatcher.utter_message(
                text=f"Hiện không còn tour nào khác cho {dest_text}. Bạn muốn đổi địa điểm hoặc ngân sách không?"
            )
            return events

        for t in fresh_tours:
            shown_titles.add(t["title"])
        events.append(SlotSet("shown_tours", "||".join(shown_titles)))

        if desired_count == 1:
            tour = fresh_tours[0]
            dispatcher.utter_message(
                text=_format_tour_message(tour, traveler_name),
                image=tour.get("main_image"),
            )
            dispatcher.utter_message(
                text="Bạn muốn giữ chỗ tour này? Cho mình xin tên và số điện thoại để tư vấn viên gọi lại nhé."
            )
        else:
            bodies = [_format_tour_message_no_header(tour) for tour in fresh_tours]
            dispatcher.utter_message(
                text="Dạ TravelTour gợi ý một số tour sau:\n" + "\n\n".join(bodies)
            )
        return events


class ActionRecommendTourByBudget(Action):
    """Action để đề xuất tour chỉ dựa trên ngân sách, không yêu cầu địa điểm cụ thể."""
    
    def name(self) -> Text:
        return "action_recommend_tour_by_budget"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        traveler_name = tracker.get_slot("traveler_name")
        intent_name = tracker.latest_message.get("intent", {}).get("name")
        
        # Parse budget từ message
        budget_range = utils.parse_budget(latest_message)
        travel_month = utils.parse_month(latest_message)
        
        if not budget_range:
            dispatcher.utter_message(
                text="Bạn có thể cho mình biết ngân sách khoảng bao nhiêu không? Ví dụ: 3 triệu, 5-10 triệu..."
            )
            return []
        
        min_budget, max_budget = budget_range
        if min_budget == 0:
            budget_text = f"{max_budget // 1_000_000} triệu"
        elif min_budget == max_budget:
            budget_text = f"{min_budget // 1_000_000} triệu"
        else:
            budget_text = f"{min_budget // 1_000_000}-{max_budget // 1_000_000} triệu"
        
        # Lấy số lượng tour muốn hiển thị
        desired_count = 4 if intent_name in {"ask_more_tours", "ask_list_tours"} else 1
        
        # Gọi recommend_tours chỉ với budget_range, không cần destinations
        tour_list = utils.recommend_tours(
            count=desired_count,
            destinations=None,  # Không filter theo địa điểm
            budget_range=budget_range,
            travel_month=travel_month,
        )
        
        if not tour_list:
            dispatcher.utter_message(
                text=f"Hiện TravelTour chưa có tour nào phù hợp với ngân sách {budget_text}. Bạn có thể thử mức giá khác hoặc cho mình biết bạn muốn đi đâu nhé!"
            )
            return []
        
        # Xử lý danh sách tour đã hiển thị trước đó
        shown_titles_raw = tracker.get_slot("shown_tours") or ""
        shown_titles = {t for t in shown_titles_raw.split("||") if t}
        fresh_tours = [t for t in tour_list if t["title"] not in shown_titles]
        
        if not fresh_tours:
            dispatcher.utter_message(
                text=f"Hiện không còn tour nào khác phù hợp với ngân sách {budget_text}. Bạn muốn thử mức giá khác hoặc đổi địa điểm không?"
            )
            return []
        
        # Cập nhật danh sách tour đã hiển thị
        events: List[Dict[Text, Any]] = []
        for t in fresh_tours:
            shown_titles.add(t["title"])
        events.append(SlotSet("shown_tours", "||".join(shown_titles)))
        
        # Hiển thị tour
        if desired_count == 1:
            tour = fresh_tours[0]
            dispatcher.utter_message(
                text=_format_tour_message(tour, traveler_name),
                image=tour.get("main_image"),
            )
            dispatcher.utter_message(
                text="Bạn muốn giữ chỗ tour này? Cho mình xin tên và số điện thoại để tư vấn viên gọi lại nhé."
            )
        else:
            bodies = [_format_tour_message_no_header(tour) for tour in fresh_tours]
            dispatcher.utter_message(
                text=f"Dạ TravelTour gợi ý các tour phù hợp với ngân sách {budget_text}:\n" + "\n\n".join(bodies)
            )
        
        return events


class ActionGetPlaceAddress(Action):
    def name(self) -> Text:
        return "action_get_place_address"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        destination = tracker.get_slot("destination")
        if not destination:
            destination = next(tracker.get_latest_entity_values("destination"), None)
        
        # Nếu không có entity, thử tìm tên địa điểm trong query
        if not destination:
            _ensure_tourist_data_loaded()
            query_lower = latest_message.lower()
            
            # Thử tìm trực tiếp trong query
            place_info = _find_place(query_lower)
            if place_info:
                destination = place_info["name"]
            else:
                # Loại bỏ các từ không quan trọng và thử lại
                stop_words = ["ở", "đâu", "tại", "nằm", "thuộc", "tỉnh", "nào", "địa", "chỉ", "của", "là", "gì", "vậy", "bạn", "cho", "mình", "biết", "địa", "điểm", "nào", "ạ"]
                query_words_clean = [w for w in query_lower.split() if w not in stop_words and len(w) > 1]
                location_query_clean = " ".join(query_words_clean).strip()
                
                if location_query_clean:
                    place_info = _find_place(location_query_clean)
                    if place_info:
                        destination = place_info["name"]

        if not destination:
            dispatcher.utter_message(text="Bạn muốn hỏi địa chỉ của địa điểm nào ạ?")
            return []

        place = _find_place(destination)
        if not place:
            dispatcher.utter_message(
                text=f"TravelTour chưa có dữ liệu về {destination}, bạn thử địa điểm khác giúp mình nhé."
            )
            return []

        dispatcher.utter_message(
            text=(
                f"{place['name']} thuộc {place['province']}.\n"
                f"Địa chỉ tham khảo: {place['address']}."
            )
        )
        return [SlotSet("destination", place["name"])]


class ActionRecommendPlacesByProvince(Action):
    def name(self) -> Text:
        return "action_recommend_places_by_province"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        province_candidates: List[str] = []
        latest_entity = next(tracker.get_latest_entity_values("province"), None)
        if latest_entity:
            province_candidates.append(latest_entity)

        if not province_candidates:
            province_candidates.extend(
                _fallback_provinces_from_text(tracker.latest_message.get("text"))
            )

        slot_value = tracker.get_slot("province")
        if not province_candidates and slot_value:
            province_candidates.append(slot_value)

        if not province_candidates:
            destination = tracker.get_slot("destination")
            place = _find_place(destination)
            if place:
                province_candidates.append(place["province"])

        if not province_candidates:
            last_dest = tracker.get_slot("last_destinations")
            if last_dest:
                for part in last_dest.split(","):
                    if part:
                        province_candidates.append(part)

        province_info = None
        for candidate in province_candidates:
            province_info = _resolve_province(candidate)
            if province_info:
                break

        if not province_info:
            dispatcher.utter_message(text="Bạn muốn tham khảo địa điểm ở tỉnh/thành nào ạ?")
            return []

        events: List[Dict[Text, Any]] = _events_when_province_changes(
            tracker.get_slot("province"), province_info["display_name"]
        )
        places = _get_places_for_province(province_info, limit=5)
        if not places:
            dispatcher.utter_message(text=f"Hiện TravelTour chưa cập nhật địa điểm nổi bật ở {province_info['display_name']}.")
            return events

        lines = [f"Top địa điểm nên ghé ở {province_info['display_name']}:"] + [
            f"- {place['name']} ({place.get('address', 'Đang cập nhật')})" for place in places
        ]
        dispatcher.utter_message(text="\n".join(lines))
        return events


class ActionSuggestTourForPlace(Action):
    def name(self) -> Text:
        return "action_suggest_tour_for_place"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        destination = tracker.get_slot("destination")
        if not destination:
            destination = next(tracker.get_latest_entity_values("destination"), None)

        if not destination:
            dispatcher.utter_message(text="Bạn muốn tìm tour cho địa điểm nào ạ?")
            return []

        place = _find_place(destination)
        if not place:
            dispatcher.utter_message(text=f"Mình chưa có dữ liệu tour cho {destination}, bạn thử điểm khác nhé.")
            return []

        tour_list = utils.recommend_tours(count=1, destinations=[place["province"]])
        if not tour_list:
            tour_list = utils.recommend_tours(count=1, destinations=[place["name"]])

        if not tour_list:
            dispatcher.utter_message(text=f"Hiện chưa có tour phù hợp cho {place['name']}, TravelTour sẽ bổ sung sớm nhé.")
            return []

        dispatcher.utter_message(text=_format_tour_message(tour_list[0], tracker.get_slot("traveler_name")))
        return [SlotSet("destination", place["name"])]


class ActionSuggestPlacesByTheme(Action):
    def name(self) -> Text:
        return "action_suggest_places_by_theme"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        theme = tracker.get_slot("travel_theme")
        if not theme:
            theme = next(tracker.get_latest_entity_values("travel_theme"), None)
        province = tracker.get_slot("province")
        if not province:
            province = next(tracker.get_latest_entity_values("province"), None)

        if not theme:
            dispatcher.utter_message(text="Bạn muốn tìm loại trải nghiệm nào? (ví dụ: biển, chùa, thiên nhiên...)")
            return []

        province_info = _resolve_province(province) if province else None
        province_key = province_info["key"] if province_info else None
        results = _filter_places_by_theme(theme, province_key=province_key, limit=5)

        if not results:
            target_text = f" ở {province_info['display_name']}" if province_info else ""
            dispatcher.utter_message(text=f"Mình chưa tìm được địa điểm phù hợp với chủ đề này{target_text}.")
            return _events_when_province_changes(
                tracker.get_slot("province"),
                province_info["display_name"] if province_info else None,
            )

        header = (
            f"Địa điểm theo chủ đề {theme} tại {province_info['display_name']}:" if province_info
            else f"Địa điểm theo chủ đề {theme} mà bạn nên ghé:"
        )
        lines = [header] + [
            f"- {place['name']} ({place['province']}): {place['address']}" for place in results
        ]
        dispatcher.utter_message(text="\n".join(lines))
        events: List[Dict[Text, Any]] = _events_when_province_changes(
            tracker.get_slot("province"),
            province_info["display_name"] if province_info else None,
        )
        events.append(SlotSet("travel_theme", theme))
        return events


class ActionGetSpecialtyAddress(Action):
    def name(self) -> Text:
        return "action_get_specialty_address"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        specialty_name = tracker.get_slot("specialty")
        if not specialty_name:
            specialty_name = next(tracker.get_latest_entity_values("specialty"), None)
        
        # Nếu không có entity, thử tìm tên món trong query
        if not specialty_name:
            _ensure_specialty_data_loaded()
            query_lower = latest_message.lower()
            # Tìm tên món ăn trong query
            for province_key, province_info in SPECIALTY_DATA.items():
                for item in province_info["items"]:
                    item_name_lower = item["name"].lower()
                    # Kiểm tra tên món có trong query không
                    if item_name_lower in query_lower:
                        specialty_name = item["name"]
                        break
                if specialty_name:
                    break
        
        if not specialty_name:
            dispatcher.utter_message(text="Bạn muốn hỏi món đặc sản nào ạ?")
            return []

        specialty = _find_specialty(specialty_name)
        if not specialty:
            dispatcher.utter_message(text=f"Mình chưa có thông tin về món {specialty_name}, bạn thử món khác nhé.")
            return []

        # Trả về thông tin chi tiết hơn
        response_lines = [f"{specialty['name']} là đặc sản của {specialty['province']}."]
        
        # Kiểm tra xem có related_locations không
        related_locs = specialty.get("related_locations", [])
        if related_locs:
            # Có related_locations -> hiển thị related_locations
            response_lines.append("\nCác địa điểm du lịch liên quan:")
            for loc_name in related_locs:
                place_info = _find_place(loc_name)
                if place_info:
                    response_lines.append(f"- {place_info['name']} ({place_info['address']})")
                else:
                    response_lines.append(f"- {loc_name}")
        else:
            # Không có related_locations -> hiển thị district + address
            if specialty.get("district"):
                response_lines.append(f"Khu vực: {specialty['district']}, {specialty['address']}")
            else:
                response_lines.append(f"Địa chỉ: {specialty.get('address', '')}")
        
        dispatcher.utter_message(text="\n".join(response_lines))
        return []


class ActionRecommendSpecialtiesByProvince(Action):
    def name(self) -> Text:
        return "action_recommend_specialties_by_province"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")

        # Ưu tiên: Tìm theo địa điểm cụ thể trước (bao gồm district)
        location_result = get_specialties_by_location(latest_message)
        
        if location_result:
            response = generate_specialty_response(latest_message)
            if response:
                dispatcher.utter_message(text=response)

                province_name = None
                if location_result["type"] == "province":
                    province_name = location_result["province"]["display_name"]
                elif location_result["type"] == "district":
                    province_name = location_result["province"]
                elif location_result["type"] == "attraction":
                    province_name = location_result["location"]["province"]

                events = []
                if province_name:
                    events.extend(_events_when_province_changes(tracker.get_slot("province"), province_name))

                if "specialties" in location_result:
                    displayed_count = min(5, len(location_result["specialties"]))
                    events.append(SlotSet("displayed_specialty_count", displayed_count))

                return events
            else:
                # Không tìm thấy response từ generate_specialty_response
                dispatcher.utter_message(text="Hiện TravelTour chưa có thông tin đặc sản cho địa điểm này. Bạn có thể thử hỏi về địa điểm khác.")
                return []

        # Fallback: Kiểm tra province slot
        province_slot = tracker.get_slot("province")
        if province_slot:
            location_result = get_specialties_by_location(province_slot)
            if location_result and location_result.get("type") == "province":
                response = generate_specialty_response(latest_message, {"province": province_slot})
                if response:
                    dispatcher.utter_message(text=response)
                    if "specialties" in location_result:
                        displayed_count = min(5, len(location_result["specialties"]))
                        return [SlotSet("displayed_specialty_count", displayed_count)]
                return []

        # Fallback cuối: tìm theo entity province
        province_candidates: List[str] = []
        latest_entity = next(tracker.get_latest_entity_values("province"), None)
        if latest_entity:
            province_candidates.append(latest_entity)

        if not province_candidates:
            province_candidates.extend(
                _fallback_provinces_from_text(latest_message)
            )

        slot_value = tracker.get_slot("province")
        if not province_candidates and slot_value:
            province_candidates.append(slot_value)

        # Nếu vẫn chưa có candidate, thử tìm trực tiếp trong SPECIALTY_DATA từ latest_message
        if not province_candidates:
            _ensure_specialty_data_loaded()
            normalized_message = _normalize_text(latest_message)
            for province_key, province_info in SPECIALTY_DATA.items():
                display_name = province_info.get("display_name", "")
                if display_name and _normalize_text(display_name) in normalized_message:
                    province_candidates.append(display_name)
                    break
                # Kiểm tra aliases
                for alias in province_info.get("aliases", []):
                    if alias and _normalize_text(alias) in normalized_message:
                        province_candidates.append(display_name)
                        break
                if province_candidates:
                    break

        province_specialty = None
        for candidate in province_candidates:
            province_specialty = _resolve_specialty_province(candidate)
            if province_specialty:
                break

        if not province_specialty:
            dispatcher.utter_message(text="Bạn muốn tìm đặc sản vùng nào vậy?")
            return []

        events: List[Dict[Text, Any]] = _events_when_province_changes(
            tracker.get_slot("province"), province_specialty["display_name"]
        )
        items = province_specialty.get("items", [])[:5]
        if not items:
            dispatcher.utter_message(text=f"Hiện TravelTour chưa cập nhật đặc sản ở {province_specialty['display_name']}.")
            return events

        lines = [f"Đặc sản bạn nên thử ở {province_specialty['display_name']}:"] + [
            f"- {item['name']} ({item.get('address', 'Đang cập nhật')})" for item in items
        ]
        dispatcher.utter_message(text="\n".join(lines))
        events.append(SlotSet("displayed_specialty_count", len(items)))

        return events


class ActionRecommendSpecialtiesForTour(Action):
    def name(self) -> Text:
        return "action_recommend_specialties_for_tour"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        current_intent = tracker.latest_message.get("intent", {}).get("name")

        # Ưu tiên province slot trước
        province_slot = tracker.get_slot("province")
        current_tour = self._extract_current_tour(tracker) if not province_slot else None

        context = {
            "current_tour": current_tour,
            "displayed_count": tracker.get_slot("displayed_specialty_count") or 0,
            "province": province_slot
        }

        # Xử lý ask_more_food_specialty
        if current_intent == "ask_more_food_specialty" and context["displayed_count"] > 0:
            province_name = context.get("province") or self._extract_province_from_tour(current_tour)

            if province_name:
                location_result = get_specialties_by_location(province_name)
                if location_result and "specialties" in location_result:
                    all_specialties = location_result["specialties"]
                    total_available = len(all_specialties)

                    if context["displayed_count"] < total_available:
                        remaining_specialties = all_specialties[context["displayed_count"]:context["displayed_count"] + 5]
                        if remaining_specialties:
                            specialty_list = "\n".join([
                                f"- {item['name']} ({item.get('district', '')}, {item.get('address', 'Đang cập nhật')})"
                                for item in remaining_specialties if item
                            ])
                            response = f"Còn một số đặc sản khác tại {province_name}:\n{specialty_list}"
                            dispatcher.utter_message(text=response)

                            new_count = context["displayed_count"] + len(remaining_specialties)
                            return [SlotSet("displayed_specialty_count", new_count)]
                        else:
                            dispatcher.utter_message(text="Hiện tại hệ thống đã hiển thị tất cả các món đặc sản liên quan đến địa điểm này.")
                            return []
                    else:
                        dispatcher.utter_message(text="Hiện tại hệ thống đã hiển thị tất cả các món đặc sản liên quan đến địa điểm này.")
                        return []
            else:
                dispatcher.utter_message(text="Bạn muốn xem thêm đặc sản của địa điểm nào ạ?")
                return []

        # Xử lý ask_food_specialty_of_current_tour - ƯU TIÊN CONTEXT TOUR HIỆN TẠI
        if current_intent == "ask_food_specialty_of_current_tour":
            # Ưu tiên tìm province từ các nguồn sau:
            # 1. Province slot hiện tại
            # 2. Last destinations từ tour vừa đề xuất
            # 3. Extract từ current_tour
            province_name = (province_slot or
                           self._extract_province_from_last_destinations(tracker) or
                           self._extract_province_from_tour(current_tour))

            if province_name:
                location_result = get_specialties_by_location(province_name)
                if location_result and location_result.get("type") == "province":
                    specialties = location_result["specialties"]
                    specialty_list = "\n".join([
                        f"- {item['name']} ({item.get('district', '')}, {item.get('address', 'Đang cập nhật')})"
                        for item in specialties[:5]
                    ])
                    response = f"Đặc sản bạn nên thử ở {province_name}:\n{specialty_list}"
                    dispatcher.utter_message(text=response)
                    return [SlotSet("displayed_specialty_count", len(specialties[:5]))]
                else:
                    dispatcher.utter_message(text=f"Hiện TravelTour chưa cập nhật đặc sản ở {province_name}.")
                    return []
            else:
                # Fallback: tìm từ lịch sử conversation
                province_from_history = self._extract_province_from_conversation_history(tracker)
                if province_from_history:
                    location_result = get_specialties_by_location(province_from_history)
                    if location_result and location_result.get("type") == "province":
                        specialties = location_result["specialties"]
                        specialty_list = "\n".join([
                            f"- {item['name']} ({item.get('district', '')}, {item.get('address', 'Đang cập nhật')})"
                            for item in specialties[:5]
                        ])
                        response = f"Đặc sản bạn nên thử ở {province_from_history}:\n{specialty_list}"
                        dispatcher.utter_message(text=response)
                        return [SlotSet("displayed_specialty_count", len(specialties[:5]))]

                dispatcher.utter_message(text="Bạn đang hỏi về đặc sản của tour nào vậy?")
                return []

        # Xử lý câu hỏi mới về đặc sản
        response = generate_specialty_response(latest_message, context)
        if response:
            dispatcher.utter_message(text=response)

            if "đặc sản" in latest_message.lower() or "món ăn" in latest_message.lower():
                return [SlotSet("displayed_specialty_count", 5)]

        return []

    def _extract_current_tour(self, tracker: Tracker) -> Optional[str]:
        """Trích xuất thông tin tour hiện tại từ lịch sử conversation"""
        current_tour = tracker.get_slot("current_tour")
        if current_tour:
            return current_tour

        recent_messages = []
        for i in range(min(5, len(tracker.events))):
            event = tracker.events[-(i+1)]
            if hasattr(event, 'text') and event.text:
                recent_messages.append(event.text.lower())

        tour_keywords = ["tour", "du lịch", "đi"]
        _ensure_tourist_data_loaded()
        
        for msg in recent_messages:
            if any(keyword in msg for keyword in tour_keywords):
                for province_key, province_info in TOURIST_DATA.items():
                    display_name = province_info.get("display_name", province_key)
                    if display_name.lower() in msg:
                        return f"Tour {display_name}"
                    for alias in province_info.get("aliases", []):
                        if alias.lower() in msg:
                            return f"Tour {display_name}"

        return None

    def _extract_province_from_tour(self, tour_name: Optional[str]) -> Optional[str]:
        """Trích xuất tỉnh/thành từ tên tour"""
        if not tour_name:
            return None

        _ensure_specialty_data_loaded()
        tour_lower = tour_name.lower()

        for province_key, province_info in SPECIALTY_DATA.items():
            if province_info["display_name"].lower() in tour_lower:
                return province_info["display_name"]
            for alias in province_info.get("aliases", []):
                if alias.lower() in tour_lower:
                    return province_info["display_name"]

        return None

    def _extract_province_from_last_destinations(self, tracker: Tracker) -> Optional[str]:
        """Trích xuất province từ slot last_destinations"""
        last_destinations = tracker.get_slot("last_destinations")
        if not last_destinations:
            return None

        # Lấy destination đầu tiên (thường là province)
        destinations = [d.strip() for d in last_destinations.split(",") if d.strip()]
        if destinations:
            return destinations[0]
        return None

    def _extract_province_from_conversation_history(self, tracker: Tracker) -> Optional[str]:
        """Trích xuất province từ lịch sử conversation gần đây"""
        recent_messages = []
        for i in range(min(10, len(tracker.events))):
            event = tracker.events[-(i+1)]
            if hasattr(event, 'text') and event.text:
                recent_messages.append(event.text.lower())

        _ensure_specialty_data_loaded()
        _ensure_tourist_data_loaded()

        # Tìm trong TOURIST_DATA trước (cho tour)
        for msg in recent_messages:
            for province_key, province_info in TOURIST_DATA.items():
                display_name = province_info.get("display_name", province_key)
                if display_name.lower() in msg:
                    return display_name
                for alias in province_info.get("aliases", []):
                    if alias.lower() in msg:
                        return display_name

        # Fallback: tìm trong SPECIALTY_DATA
        for msg in recent_messages:
            for province_key, province_info in SPECIALTY_DATA.items():
                display_name = province_info.get("display_name", "")
                if display_name and display_name.lower() in msg:
                    return display_name
                for alias in province_info.get("aliases", []):
                    if alias and alias.lower() in msg:
                        return display_name

        return None


class ActionGetSpecialtyLocation(Action):
    def name(self) -> Text:
        return "action_get_specialty_location"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        latest_message = tracker.latest_message.get("text", "")
        specialty_name = tracker.get_slot("specialty")

        if not specialty_name:
            specialty_name = next(tracker.get_latest_entity_values("specialty"), None)

        if specialty_name:
            specialty = _find_specialty(specialty_name)
            if specialty:
                locations = get_location_for_specialty(specialty_name)
                # Kiểm tra xem có related_locations không
                related_locs = specialty.get("related_locations", [])
                has_attraction_locations = any(loc.get("type") == "attraction" for loc in locations)
                
                if has_attraction_locations:
                    # Có related_locations -> hiển thị related_locations
                    if len(locations) == 1:
                        loc = locations[0]
                        if loc["type"] == "attraction":
                            response = f"Món {specialty_name} thường gắn với địa điểm du lịch {loc['name']} ({loc['address']})."
                        else:
                            response = f"Món {specialty_name} là đặc sản của {loc['province']}."
                    else:
                        location_list = "\n".join([
                            f"- {loc['name']} ({loc['address']})" if loc['type'] == 'attraction' 
                            else f"- {loc['province']}"
                            for loc in locations
                        ])
                        response = f"Món {specialty_name} thường gắn với các địa điểm du lịch sau:\n{location_list}"
                else:
                    # Không có related_locations -> hiển thị district + address
                    if specialty.get("district"):
                        response = f"Món {specialty_name} là đặc sản của {specialty['province']}.\nKhu vực: {specialty['district']}, {specialty.get('address', '')}"
                    else:
                        response = f"Món {specialty_name} là đặc sản của {specialty['province']}.\nĐịa chỉ: {specialty.get('address', '')}"
                
                dispatcher.utter_message(text=response)
                return []

        # Fallback: Sử dụng generate_specialty_response
        response = generate_specialty_response(latest_message)
        if response:
            dispatcher.utter_message(text=response)
            return []

        dispatcher.utter_message(text="Bạn muốn hỏi địa điểm của món đặc sản nào ạ?")
        return []


class ActionSaveTravelerName(Action):
    def name(self) -> Text:
        return "action_save_traveler_name"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        traveler_name = next(tracker.get_latest_entity_values("traveler_name"), None)
        if not traveler_name:
            dispatcher.utter_message(text="TravelTour xin chào, mình có thể hỗ trợ tour nào cho bạn?")
            return [SlotSet("traveler_name", "bạn")]

        dispatcher.utter_message(
            text=f"Chào {traveler_name}! Bạn muốn tìm tour ở đâu hoặc ngân sách khoảng bao nhiêu ạ?"
        )
        return [SlotSet("traveler_name", traveler_name)]


class ActionConfirmBooking(Action):
    def name(self) -> Text:
        return "action_confirm_booking"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        name = tracker.get_slot("traveler_name")
        phone = tracker.get_slot("phone_number")
        group_size = tracker.get_slot("group_size")
        destination = tracker.get_slot("destination")

        if not name or not phone:
            dispatcher.utter_message(
                text=(
                    "Để mình giữ chỗ chính xác cho bạn, vui lòng cho mình biết đầy đủ tên và số điện thoại nhé. "
                    "Bạn có thể trả lời kiểu: 'mình là An, sdt 09xxxxxxxx'."
                )
            )
            return []

        dispatcher.utter_message(
            text=(
                f"Cảm ơn {name}! TravelTour đã nhận thông tin {group_size} khách cho tour {destination}. "
                f"Tư vấn viên sẽ liên hệ qua số {phone} trong ít phút nữa."
            )
        )
        return []


class ValidateBookingInfoForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_booking_info_form"

    def validate_traveler_name(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        if isinstance(slot_value, str) and len(slot_value.strip()) >= 2:
            return {"traveler_name": slot_value.strip()}
        dispatcher.utter_message(text="Tên chưa hợp lệ, bạn nhập lại giúp mình nhé.")
        return {"traveler_name": None}

    def validate_phone_number(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        digits = re.sub(r"[^0-9]", "", str(slot_value))
        if 9 <= len(digits) <= 11:
            return {"phone_number": digits}
        dispatcher.utter_message(
            text=(
                "Số điện thoại chưa đúng định dạng ạ. "
                "Bạn nhập lại giúp mình theo dạng 'sdt 09xxxxxxxx' hoặc '0903xxx...' nhé."
            )
        )
        return {"phone_number": None}

    def validate_group_size(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        try:
            size = int(slot_value)
            if 1 <= size <= 50:
                return {"group_size": size}
        except (ValueError, TypeError):
            pass
        dispatcher.utter_message(text="Bạn cho mình biết số lượng khách (1-50) nhé.")
        return {"group_size": None}


class ActionResetContext(Action):
    def name(self) -> Text:
        return "action_reset_context"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        """
        Xử lý khi người dùng đổi ý: nếu có entity mới -> giữ, còn lại xoá các slot chính.
        """
        latest_entities = tracker.latest_message.get("entities", [])
        new_province = next(
            (e.get("value") for e in latest_entities if e.get("entity") == "province"),
            None,
        )
        new_destination = next(
            (e.get("value") for e in latest_entities if e.get("entity") == "destination"),
            None,
        )
        new_theme = next(
            (e.get("value") for e in latest_entities if e.get("entity") == "travel_theme"),
            None,
        )

        events: List[Dict[Text, Any]] = []
        for slot_name in [
            "province",
            "destination",
            "travel_theme",
            "budget_range",
            "travel_month",
        ]:
            events.append(SlotSet(slot_name, None))

        if new_province:
            events.append(SlotSet("province", new_province))
        if new_destination:
            events.append(SlotSet("destination", new_destination))
        if new_theme:
            events.append(SlotSet("travel_theme", new_theme))

        if new_province or new_destination or new_theme:
            dispatcher.utter_message(
                text="Mình đã cập nhật lại thông tin bạn vừa đổi. Bạn cần gợi ý gì tiếp?"
            )
        else:
            dispatcher.utter_message(
                text="Mình đã xoá thông tin trước đó. Bạn muốn đi đâu/chủ đề gì và ngân sách khoảng bao nhiêu?"
            )

        return events