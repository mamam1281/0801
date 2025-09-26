# PowerShell 로그인 테스트 스크립트

$loginData = @{
    site_id  = "user001"
    password = "123455"
} | ConvertTo-Json

Write-Host "로그인 요청 데이터: $loginData"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData -ErrorAction Stop
    Write-Host "✅ 로그인 성공!"
    Write-Host "토큰: $($response.access_token.Substring(0,50))..."
    Write-Host "사용자: $($response.user.site_id)"
}
catch {
    Write-Host "❌ 로그인 실패!"
    Write-Host "상태코드: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "에러: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답 본문: $responseBody"
    }
}