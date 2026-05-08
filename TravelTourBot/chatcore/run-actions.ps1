# Script để chạy Rasa Action Server
# Sử dụng: .\run-actions.ps1

# Kích hoạt virtualenv nếu có
if (Test-Path "..\.venv\Scripts\Activate.ps1") {
    & "..\.venv\Scripts\Activate.ps1"
}

# Chạy action server
rasa run actions





