## TravelTourBot – Chatbot tư vấn du lịch (Rasa 3.6, tiếng Việt)

TravelTourBot là chatbot tư vấn tour du lịch bằng tiếng Việt, xây dựng trên **Rasa 3.6**.  
Bot hỗ trợ gợi ý tour, trả lời câu hỏi về địa điểm du lịch, đặc sản từng vùng và thu thập thông tin đặt tour (tên, số điện thoại, số lượng khách).

---

### Yêu cầu hệ thống

- Python 3.8.x
- Rasa 3.6 (cài qua `pip install -r requirements.txt` trong thư mục `chatcore`)


---

### Cấu trúc thư mục chính

```text
TravelTourBot/
  chatcore/              # Project Rasa chính
    actions/
      actions.py         # Toàn bộ custom actions (tour, địa điểm, đặc sản, fallback...)
      utils.py           # Hàm tiện ích: parse điểm đến, ngân sách, tháng, lọc tour
    data/
      nlu.yml            # Intents, entities, lookup tables (destination, province, specialty...)
      stories.yml        # Stories hội thoại
      rules.yml          # Rules (fallback, form...)
      tours.json         # Dữ liệu tour (mã tour, điểm đến, giá, đánh giá...)
      đia_diem_du_lich.py# Danh sách địa điểm du lịch theo tỉnh/thành
      dac_san_tung_noi.py# Danh sách đặc sản theo tỉnh/thành
      data-answer.json   # Dữ liệu cho ResponseSelector (nếu dùng)
      unknown_questions.jsonl # Log câu hỏi lạ để training lại (tự sinh)
    tools/
      sync_destination_lookup.py # Script đồng bộ lookup `destination` từ đia_diem_du_lich.py vào nlu.yml
    tests/
      test_stories.yml   # Stories dùng cho `rasa test`
    config.yml           # Pipeline NLU + policies Core
    domain.yml           # Intents, entities, slots, responses, forms, actions
    credentials.yml      # Cấu hình channel (REST, SocketIO...)
    endpoints.yml        # Cấu hình action server, tracker store...
    requirements.txt     # Danh sách package Python (Rasa 3.6, phụ thuộc liên quan)

  .gitignore
  README.md
```

---

### Cách cài đặt & chạy

#### Bước 1: Tạo và kích hoạt virtualenv

```bash
cd E:\rasa_chatbot\TravelTourBot

python -m venv .venv
.\.venv\Scripts\activate      # Windows PowerShell
```

#### Bước 2: Cài dependencies

```bash
cd chatcore
pip install -r requirements.txt
```

> Lưu ý: Rasa 3.6 yêu cầu Python 3.8, môi trường ảo nên dùng đúng phiên bản 3.8.

#### Bước 2.5: Cấu hình API Backend (Tùy chọn)

Chatbot sẽ tự động lấy dữ liệu tour từ API backend thay vì file JSON.  
Để cấu hình URL của backend API, bạn có thể:

**Cách 1: Sử dụng biến môi trường (Khuyến nghị)**
```bash
# Windows PowerShell
$env:BACKEND_API_URL="http://localhost:5000"

# Linux/Mac
export BACKEND_API_URL="http://localhost:5000"
```

**Cách 2: Sửa trực tiếp trong code**
Mở file `chatcore/actions/utils.py` và thay đổi giá trị mặc định:
```python
API_BASE_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000")
```

> **Lưu ý**: 
> - Mặc định chatbot sẽ gọi API tại `http://localhost:5000/api/tours`
> - Nếu API không khả dụng, chatbot sẽ tự động fallback về file `tours.json`
> - Đảm bảo backend đang chạy và endpoint `/api/tours` hoạt động trước khi chạy chatbot

#### Bước 3: Train mô hình

```bash
cd E:\rasa_chatbot\TravelTourBot\chatcore
rasa train
```

Model sẽ được lưu trong thư mục `chatcore/models/` (đã được .gitignore).

#### Bước 4: Chạy action server

Mở **cửa sổ terminal 1**:

```bash
cd E:\rasa_chatbot\TravelTourBot\chatcore
.\.venv\Scripts\activate   # nếu chưa kích hoạt
rasa run actions
```

#### Bước 5: Chạy bot để test

Mở **cửa sổ terminal 2**:

```bash
cd E:\rasa_chatbot\TravelTourBot\chatcore
.\.venv\Scripts\activate   # nếu cần

# Chat trực tiếp trong console
rasa shell

# Hoặc chạy server REST API
# rasa run --enable-api --cors "*"
```

---

### Các tính năng chính

- **Gợi ý tour chung / cá nhân hóa**  
  - Intents: `ask_tour_general`, `ask_tour_personalized`  
  - Actions: `action_recommend_general_tour`, `action_recommend_personalized_tour`  
  - **Dữ liệu tour**: Lấy từ API backend (`/api/tours`).  
  - Fallback: Nếu API không khả dụng, chatbot sẽ tự động sử dụng file `tours.json` làm dữ liệu dự phòng.


- **Hỏi thông tin địa điểm du lịch**  
  - Intents: `ask_place_address`, `ask_top_places_city`, `ask_place_by_theme`, `ask_tour_for_place`  
  - Data: `đia_diem_du_lich.py`  
  - Actions: `action_get_place_address`, `action_recommend_places_by_province`, `action_suggest_places_by_theme`, `action_suggest_tour_for_place`.

- **Hỏi đặc sản từng vùng**  
  - Intents: `ask_food_specialty`, `ask_food_address`  
  - Data: `dac_san_tung_noi.py`  
  - Actions: `action_get_specialty_address`, `action_recommend_specialties_by_province`.

- **Form đặt tour & xác nhận thông tin**  
  - Form: `booking_info_form` với slots `traveler_name`, `phone_number`, `group_size`.  
  - Actions: `validate_booking_info_form`, `action_confirm_booking` (nhắc nhập lại nếu thiếu tên/sđt).

- **Fallback & học từ câu hỏi lạ**  
  - `FallbackClassifier` + `RulePolicy` → intent `nlu_fallback`.  
  - `action_log_unknown_question`: ghi log vào `data/unknown_questions.jsonl` để bạn xem lại và bổ sung vào `nlu.yml`.

- **Công cụ sync lookup địa điểm**  
  - `tools/sync_destination_lookup.py`: tự động cập nhật block `lookup: destination` trong `nlu.yml` từ `đia_diem_du_lich.py`.

---

### Lưu ý phát triển

- Mỗi khi chỉnh `nlu.yml`, `stories.yml`, `domain.yml` hoặc `actions.py` → luôn chạy lại `rasa train`.  
- Định kỳ xem `data/unknown_questions.jsonl` để lấy thêm câu hỏi thực tế đưa vào `nlu.yml`.  
- Các thư mục/file không nên push lên git đã được cấu hình trong `.gitignore`: `.venv/`, `__pycache__/`, `chatcore/models/`, `chatcore/.rasa/`, v.v.

