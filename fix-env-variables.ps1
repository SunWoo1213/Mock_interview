#!/usr/bin/env pwsh

<#
.SYNOPSIS
    환경 변수 중복 및 오타 수정 스크립트
    
.DESCRIPTION
    1. S3_BUCKET_NAME 추가 (올바른 철자)
    2. S3_BuCKET_NAME 제거 (오타)
    3. 불필요한 storage_ prefix 변수들 정리
#>

Write-Host "🔧 환경 변수 수정 시작..." -ForegroundColor Cyan
Write-Host ""

# S3 버킷 이름 값
$S3_BUCKET_NAME = "ai-interview-bucket"

# ======================================
# 1단계: S3_BUCKET_NAME 추가 (올바른 철자)
# ======================================
Write-Host "1️⃣ S3_BUCKET_NAME 환경 변수 추가 중..." -ForegroundColor Yellow

# Production
Write-Host "   - Production 환경에 추가 중..."
$S3_BUCKET_NAME | vercel env add S3_BUCKET_NAME production
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Production 완료" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Production 이미 존재하거나 에러" -ForegroundColor Yellow
}

# Preview
Write-Host "   - Preview 환경에 추가 중..."
$S3_BUCKET_NAME | vercel env add S3_BUCKET_NAME preview
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Preview 완료" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Preview 이미 존재하거나 에러" -ForegroundColor Yellow
}

# Development
Write-Host "   - Development 환경에 추가 중..."
$S3_BUCKET_NAME | vercel env add S3_BUCKET_NAME development
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Development 완료" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Development 이미 존재하거나 에러" -ForegroundColor Yellow
}

Write-Host ""

# ======================================
# 2단계: S3_BuCKET_NAME 제거 (오타)
# ======================================
Write-Host "2️⃣ S3_BuCKET_NAME (오타) 제거 중..." -ForegroundColor Yellow

$environments = @("production", "preview", "development")

foreach ($env in $environments) {
    Write-Host "   - $env 환경에서 제거 중..."
    vercel env rm S3_BuCKET_NAME $env --yes 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $env 제거 완료" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️ $env 에 없거나 이미 제거됨" -ForegroundColor Gray
    }
}

Write-Host ""

# ======================================
# 3단계: 불필요한 storage_ 변수들 정리
# ======================================
Write-Host "3️⃣ 불필요한 storage_ prefix 변수들 제거 중..." -ForegroundColor Yellow

$storage_vars = @(
    "storage_PGUSER",
    "storage_POSTGRES_URL_NO_SSL",
    "storage_POSTGRES_HOST",
    "storage_NEON_PROJECT_ID",
    "storage_POSTGRES_URL",
    "storage_POSTGRES_PRISMA_URL",
    "storage_DATABASE_URL_UNPOOLED",
    "storage_POSTGRES_URL_NON_POOLING",
    "storage_PGHOST",
    "storage_POSTGRES_USER",
    "storage_DATABASE_URL",
    "storage_POSTGRES_PASSWORD",
    "storage_POSTGRES_DATABASE",
    "storage_PGPASSWORD",
    "storage_PGDATABASE",
    "storage_PGHOST_UNPOOLED",
    "NEXT_PUBLIC_storage_STACK_PROJECT_ID",
    "NEXT_PUBLIC_storage_STACK_PUBLISHABLE_CLIENT_KEY",
    "storage_STACK_SECRET_SERVER_KEY"
)

Write-Host "   ⚠️ 총 $($storage_vars.Count)개의 storage_ 변수 제거 예정" -ForegroundColor Yellow
Write-Host "   ℹ️ 이 변수들은 DATABASE_URL로 대체되므로 불필요합니다" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "   제거하시겠습니까? (y/N)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    foreach ($var in $storage_vars) {
        Write-Host "   - $var 제거 중..." -NoNewline
        foreach ($env in $environments) {
            vercel env rm $var $env --yes 2>$null | Out-Null
        }
        Write-Host " ✅" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "   ✅ storage_ 변수들 제거 완료!" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ storage_ 변수 제거 건너뛰기" -ForegroundColor Gray
}

Write-Host ""

# ======================================
# 최종 환경 변수 목록 확인
# ======================================
Write-Host "4️⃣ 최종 환경 변수 목록 확인" -ForegroundColor Yellow
Write-Host ""

vercel env ls production

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=".PadRight(60, '=') -ForegroundColor Cyan
Write-Host "✅ 환경 변수 수정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 남은 작업:" -ForegroundColor Yellow
Write-Host "   1. 코드에서 S3_BUCKET_NAME 사용 확인" -ForegroundColor White
Write-Host "   2. vercel --prod --force (재배포)" -ForegroundColor White
Write-Host "   3. PDF 업로드 테스트" -ForegroundColor White
Write-Host ""





