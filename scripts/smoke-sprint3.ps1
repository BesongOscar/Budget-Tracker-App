<#
.SYNOPSIS
    Sprint 3 smoke tests — budgets, push notifications, and status lifecycle.

.PARAMETER Email
    Test user email (required).

.PARAMETER Password
    Test user password (required).

.PARAMETER BaseUrl
    API base URL. Defaults to http://localhost:3000/api/v1.

.PARAMETER DelaySeconds
    Seconds between requests (rate limit: 5/min). Defaults to 13.

.EXAMPLE
    .\smoke-sprint3.ps1 -Email "test@example.com" -Password "Test1234"
#>

param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password,
    [string]$BaseUrl = "http://localhost:3000/api/v1",
    [int]$DelaySeconds = 13
)

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0
$results = @()

function Invoke-Smoke {
    param(
        [string]$Name,
        [scriptblock]$Block
    )
    Write-Host "`n--- $Name ---" -ForegroundColor Cyan
    try {
        $result = & $Block
        $script:passed++
        $script:results += [PSCustomObject]@{ Test = $Name; Status = "PASS"; Detail = $result }
        Write-Host "PASS: $result" -ForegroundColor Green
    } catch {
        $script:failed++
        $script:results += [PSCustomObject]@{ Test = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Wait-RateLimit {
    Write-Host "  (waiting ${DelaySeconds}s for rate limit...)" -ForegroundColor DarkGray
    Start-Sleep -Seconds $DelaySeconds
}

function Auth-Headers {
    param([string]$Token)
    return @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
}

# ─── LOGIN ───────────────────────────────────────────────────────────────────
Write-Host "=== Sprint 3 Smoke Tests ===" -ForegroundColor Yellow
Write-Host "BaseUrl: $BaseUrl"
Write-Host "Rate limit delay: ${DelaySeconds}s"
Write-Host ""

Write-Host "Logging in..." -ForegroundColor Cyan
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResp.data.accessToken
$userId = $loginResp.data.user.id
Write-Host "Logged in as $Email (userId: $userId)" -ForegroundColor Green
$headers = Auth-Headers $token

# ─── HELPERS ─────────────────────────────────────────────────────────────────
$periodMonth = (Get-Date).ToString("yyyy-MM")
$nextMonth = Get-Date
if ($nextMonth.Month -eq 12) { $nextMonth = Get-Date -Year ($nextMonth.Year + 1) -Month 1 -Day 1 }
else { $nextMonth = Get-Date -Month ($nextMonth.Month + 1) -Day 1 }
$nextMonthStr = $nextMonth.ToString("yyyy-MM")

# ─── TESTS ───────────────────────────────────────────────────────────────────

# 1. Health check (no auth needed)
Invoke-Smoke "GET /health" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/../health" -Method Get
    if ($resp.data.status -ne "ok") { throw "Expected status ok, got $($resp.data.status)" }
    "API healthy"
}

Wait-RateLimit

# 2. Get existing categories
$expenseCats = @()
Invoke-Smoke "GET /categories (EXPENSE)" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/categories?type=EXPENSE" -Method Get -Headers $headers
    $script:expenseCats = @($resp.data)
    if ($expenseCats.Count -eq 0) { throw "No expense categories found" }
    "Found $($expenseCats.Count) expense categories"
}

Wait-RateLimit

# 3. Get existing income categories
$incomeCats = @()
Invoke-Smoke "GET /categories (INCOME)" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/categories?type=INCOME" -Method Get -Headers $headers
    $script:incomeCats = @($resp.data)
    if ($incomeCats.Count -eq 0) { throw "No income categories found" }
    "Found $($incomeCats.Count) income categories"
}

Wait-RateLimit

# 4. Create income transaction (seed income for the period)
$incomeCatId = $incomeCats[0].id
$incomeAmount = 10000
Invoke-Smoke "POST /transactions (income $incomeAmount)" {
    $body = @{
        amount     = $incomeAmount
        type       = "INCOME"
        categoryId = $incomeCatId
        date       = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        description = "Smoke test income"
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/transactions" -Method Post -Body $body -Headers $headers
    "Created income transaction: $($resp.data.id)"
}

Wait-RateLimit

# 5. Create budget at 60% of income (should NOT trigger 80% threshold)
$budgetCatId = $expenseCats[0].id
$allocatedAmount = 6000
$createdBudgetId = ""
Invoke-Smoke "POST /budgets (allocate $allocatedAmount)" {
    $body = @{
        categoryId     = $budgetCatId
        allocatedAmount = $allocatedAmount
        periodMonth    = $periodMonth
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets" -Method Post -Body $body -Headers $headers
    $script:createdBudgetId = $resp.data.id
    if ($resp.data.status -ne "DRAFT") { throw "Expected DRAFT status, got $($resp.data.status)" }
    "Created budget: $($resp.data.id), status: $($resp.data.status)"
}

Wait-RateLimit

# 6. Verify budget list + summary
Invoke-Smoke "GET /budgets (list + summary)" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets?month=$periodMonth" -Method Get -Headers $headers
    $budgets = $resp.data.budgets
    $summary = $resp.data.summary
    if (-not $budgets -or $budgets.Count -eq 0) { throw "No budgets returned" }
    if (-not $summary) { throw "No summary returned" }
    "Found $($budgets.Count) budgets, income=$($summary.income), allocated=$($summary.allocated)"
}

Wait-RateLimit

# 7. Add expense crossing 80% threshold (80% of 6000 = 4800)
Invoke-Smoke "POST /transactions (expense 4900 → THRESHOLD_80)" {
    $body = @{
        amount     = 4900
        type       = "EXPENSE"
        categoryId = $budgetCatId
        date       = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        description = "Smoke test — cross 80% threshold"
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/transactions" -Method Post -Body $body -Headers $headers
    "Created expense: $($resp.data.id) (push: THRESHOLD_80 should fire)"
}

Wait-RateLimit

# 8. Add expense crossing 100% (total spend now > 6000)
Invoke-Smoke "POST /transactions (expense 1200 → OVER_BUDGET)" {
    $body = @{
        amount     = 1200
        type       = "EXPENSE"
        categoryId = $budgetCatId
        date       = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        description = "Smoke test — cross 100% over-budget"
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/transactions" -Method Post -Body $body -Headers $headers
    "Created expense: $($resp.data.id) (push: OVER_BUDGET should fire)"
}

Wait-RateLimit

# 9. Verify budget status is now OVER_BUDGET
Invoke-Smoke "GET /budgets/:id (verify OVER_BUDGET)" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets/$createdBudgetId" -Method Get -Headers $headers
    if ($resp.data.status -ne "OVER_BUDGET") { throw "Expected OVER_BUDGET, got $($resp.data.status)" }
    "Status: $($resp.data.status), spent: $($resp.data.spentAmount)"
}

Wait-RateLimit

# 10. Allocate more than income → over-allocation warning
$overAllocAmount = 5000
$secondCatId = if ($expenseCats.Count -gt 1) { $expenseCats[1].id } else { $budgetCatId }
Invoke-Smoke "POST /budgets (over-allocate total > income)" {
    $body = @{
        categoryId     = $secondCatId
        allocatedAmount = $overAllocAmount
        periodMonth    = $periodMonth
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets" -Method Post -Body $body -Headers $headers
    "Created budget: $($resp.data.id) (total allocated now > income → push: over-allocation warning)"
}

Wait-RateLimit

# 11. Copy period to next month
Invoke-Smoke "POST /budgets/copy-period" {
    $body = @{
        fromMonth = $periodMonth
        toMonth   = $nextMonthStr
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets/copy-period" -Method Post -Body $body -Headers $headers
    "Copied $($resp.data.copied) budgets to $nextMonthStr"
}

Wait-RateLimit

# 12. Verify copied budgets (spent=0, status=DRAFT)
Invoke-Smoke "GET /budgets (verify copy)" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets?month=$nextMonthStr" -Method Get -Headers $headers
    $budgets = $resp.data.budgets
    if ($budgets.Count -eq 0) { throw "No budgets found in target month" }
    $bad = $budgets | Where-Object { $_.status -ne "DRAFT" -or [decimal]$_.spentAmount -ne 0 }
    if ($bad) { throw "Copied budgets should be DRAFT with spent=0" }
    "All $($budgets.Count) copied budgets are DRAFT with spent=0"
}

Wait-RateLimit

# 13. Try to delete an OVER_BUDGET budget → expect 409
Invoke-Smoke "DELETE /budgets/:id (OVER_BUDGET → 409)" {
    # Re-fetch the budget ID from the list
    $listResp = Invoke-RestMethod -Uri "$BaseUrl/budgets?month=$periodMonth" -Method Get -Headers $headers
    $target = $listResp.data.budgets | Where-Object { $_.status -eq "OVER_BUDGET" } | Select-Object -First 1
    if (-not $target) { throw "No OVER_BUDGET budget found to test delete guard" }
    try {
        Invoke-RestMethod -Uri "$BaseUrl/budgets/$($target.id)" -Method Delete -Headers $headers
        throw "Expected 409 but delete succeeded"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 409) { throw "Expected 409, got $statusCode" }
        "Correctly got 409 when deleting OVER_BUDGET budget"
    }
}

Wait-RateLimit

# 14. Test push token endpoints
Invoke-Smoke "PATCH /users/me/push-token (test)" {
    $body = @{ pushToken = "ExpoPushToken[smoke-test-token]" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$BaseUrl/users/me/push-token" -Method Patch -Body $body -Headers $headers
    $resp.data.message
}

Wait-RateLimit

# 15. Test push
Invoke-Smoke "POST /users/me/push-token/test" {
    try {
        $resp = Invoke-RestMethod -Uri "$BaseUrl/users/me/push-token/test" -Method Post -Headers $headers
        $resp.data.message
    } catch {
        # 502 is expected for a fake token
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 502) { "Got 502 as expected (fake token)" }
        else { throw "Unexpected status $statusCode" }
    }
}

Wait-RateLimit

# 16. Delete push token
Invoke-Smoke "DELETE /users/me/push-token" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/users/me/push-token" -Method Delete -Headers $headers
    $resp.data.message
}

Wait-RateLimit

# 17. Test push after delete → 404
Invoke-Smoke "POST /users/me/push-token/test (after delete → 404)" {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/users/me/push-token/test" -Method Post -Headers $headers
        throw "Expected 404 but request succeeded"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 404) { throw "Expected 404, got $statusCode" }
        "Correctly got 404 when no push token registered"
    }
}

Wait-RateLimit

# 18. Delete a DRAFT budget (from copied month)
Invoke-Smoke "DELETE /budgets/:id (DRAFT → success)" {
    $listResp = Invoke-RestMethod -Uri "$BaseUrl/budgets?month=$nextMonthStr" -Method Get -Headers $headers
    $target = $listResp.data.budgets | Where-Object { $_.status -eq "DRAFT" } | Select-Object -First 1
    if (-not $target) { throw "No DRAFT budget found to delete" }
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets/$($target.id)" -Method Delete -Headers $headers
    $resp.data.message
}

Wait-RateLimit

# 19. Verify budget list + summary still works with over-allocation
Invoke-Smoke "GET /budgets (over-allocation summary)" {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/budgets?month=$periodMonth" -Method Get -Headers $headers
    $summary = $resp.data.summary
    if (-not $summary.isOverAllocated) { throw "Expected isOverAllocated=true" }
    "Over-allocation confirmed: income=$($summary.income), allocated=$($summary.allocated)"
}

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "RESULTS: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Yellow

$results | Format-Table -AutoSize

if ($failed -gt 0) {
    Write-Host "`nSome tests failed. Check the output above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
}
