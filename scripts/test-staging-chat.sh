# Test processChat function
curl -X POST https://eocxtwjcwpgipfeayvhy.supabase.co/functions/v1/processChat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvY3h0d2pjd3BnaXBmZWF5dmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjczODcsImV4cCI6MjA3OTUwMzM4N30.CONmCS1j4u6U2GjSxRMxj4bVqYXRA-uZw7ti8oCUWHA" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Hello from staging!\"}"
