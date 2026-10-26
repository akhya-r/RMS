@echo off
cd /d "%~dp0"
if not exist backend\.env (
  copy backend\.env.example backend\.env >nul
  echo A new backend\.env file was created.
  echo Set JWT_SECRET to a random string of 24+ characters, save and close Notepad.
  notepad backend\.env
)
echo.
echo Starting AF Restaurant Management. Keep this window open while using the app.
echo Open http://localhost:5000 in your browser after the server starts.
npm start
pause
