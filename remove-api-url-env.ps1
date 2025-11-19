# Vercel 환경 변수 제거 스크립트
# NEXT_PUBLIC_API_URL을 모든 환경에서 제거

Write-Host "🔧 Vercel 환경 변수 제거 시작..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 제거할 변수: NEXT_PUBLIC_API_URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "❓ 이 변수를 제거하는 이유:" -ForegroundColor Yellow
Write-Host "   - Preview 배포에서 Production API를 호출하여 CORS 에러 발생" -ForegroundColor White
Write-Host "   - 상대 경로를 사용하면 각 환경이 자신의 API를 호출" -ForegroundColor White
Write-Host "   - Preview: /api → preview-domain.vercel.app/api" -ForegroundColor White
Write-Host "   - Production: /api → ai-service2-6.vercel.app/api" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "계속하시겠습니까? (Y/N)"

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ 취소되었습니다." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "1️⃣ Production 환경에서 제거 중..." -ForegroundColor Green
echo "y" | vercel env rm NEXT_PUBLIC_API_URL production

Write-Host ""
Write-Host "2️⃣ Preview 환경에서 제거 중..." -ForegroundColor Green
echo "y" | vercel env rm NEXT_PUBLIC_API_URL preview

Write-Host ""
Write-Host "3️⃣ Development 환경에서 제거 중..." -ForegroundColor Green
echo "y" | vercel env rm NEXT_PUBLIC_API_URL development

Write-Host ""
Write-Host "✅ 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 다음 단계:" -ForegroundColor Yellow
Write-Host "   1. Vercel이 자동으로 재배포합니다" -ForegroundColor White
Write-Host "   2. 또는 수동 재배포: vercel --prod" -ForegroundColor White
Write-Host "   3. Preview도 재배포됩니다" -ForegroundColor White
Write-Host ""
Write-Host "🔍 확인:" -ForegroundColor Yellow
Write-Host "   vercel env ls | findstr NEXT_PUBLIC_API_URL" -ForegroundColor White
Write-Host "   (아무것도 나오지 않으면 성공!)" -ForegroundColor White


