# API 핸들러 타입 에러 일괄 수정 스크립트

Write-Host "🔧 API 핸들러 타입 에러 수정 시작..." -ForegroundColor Cyan
Write-Host ""

$files = @(
    "pages/api/cover-letters/list.ts",
    "pages/api/cover-letters/create.ts",
    "pages/api/profile/index.ts",
    "pages/api/job-postings/submit-text.ts",
    "pages/api/job-postings/analyze.ts",
    "pages/api/job-postings/upload.ts",
    "pages/api/interview/start.ts",
    "pages/api/interview/answer.ts",
    "pages/api/interview/result/[id].ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 수정 중: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # 패턴 1: const xxx = withErrorHandler... → export default...
        $content = $content -replace 'const (\w+Handler) = (withErrorHandler\(withAuth\(handler\)\));[\r\n]+[\r\n]+export default \1;', 'export default $2;'
        
        # 패턴 2: handler 함수에 Promise<void> 추가
        $content = $content -replace '(async function handler\([^)]+\))([\s]*\{)', '$1: Promise<void>$2'
        
        # 패턴 3: return res.status → res.status + return
        # 너무 복잡하므로 수동으로 처리
        
        Set-Content $file $content -NoNewline
        Write-Host "✅ 완료: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  파일 없음: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ 모든 파일 처리 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 다음 단계:" -ForegroundColor Yellow
Write-Host "   1. return res.status().json() 패턴 수동 확인" -ForegroundColor White
Write-Host "   2. git add ." -ForegroundColor White
Write-Host "   3. git commit -m 'fix: API handlers type'" -ForegroundColor White
Write-Host "   4. git push origin main" -ForegroundColor White





