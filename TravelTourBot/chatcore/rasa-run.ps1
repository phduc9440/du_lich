# Script để chạy Rasa với lệnh tùy chỉnh
# Sử dụng: .\rasa-run.ps1

# Kích hoạt virtualenv nếu có
if (Test-Path "..\.venv\Scripts\Activate.ps1") {
    & "..\.venv\Scripts\Activate.ps1"
}

# Chạy rasa với các tham số
rasa run --enable-api --cors "*" --port 5006





