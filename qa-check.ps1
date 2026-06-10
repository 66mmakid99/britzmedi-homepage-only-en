$base = 'https://britzmedi-homepage-only-en.pages.dev'
$results = @()

function Test-Url {
    param($Name, $Url, $CheckString)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
        $status = $r.StatusCode
        $len = $r.Content.Length
        $found = if ($CheckString) { $r.Content -match $CheckString } else { $true }
        if ($status -eq 200 -and $found) {
            Write-Host "[PASS] $Name ($status, ${len}b)"
            return "PASS"
        } else {
            Write-Host "[FAIL] $Name ($status, check='$CheckString' found=$found)"
            return "FAIL"
        }
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'ERR' }
        Write-Host "[FAIL] $Name (Error: $code - $($_.Exception.Message.Substring(0, [Math]::Min(80, $_.Exception.Message.Length))))"
        return "FAIL"
    }
}

Write-Host "=== QA CHECK: britzmedi-global ==="
Write-Host ""

# 1. Main page + Hero
Test-Url "Main page + Hero" "$base/" "section-hero"

# 2. Product pages
Test-Url "TORR RF" "$base/products/torr-rf/" "TORR RF"
Test-Url "ULBLANC" "$base/products/ulblanc/" "ULBLANC"
Test-Url "NEWCHAE SHOT" "$base/products/newchae-shot/" "NEWCHAE"

# 3. Blog listing
Test-Url "Blog listing" "$base/blog/" "blog"

# 4. Blog posts (correct slugs)
Test-Url "Blog: Korean Beauty Device Market" "$base/blog/korean-beauty-device-market/" "article"
Test-Url "Blog: TORR RF Medical Review" "$base/blog/torr-rf-lifting-medical-professional-review/" "article"
Test-Url "Blog: Microneedle RF vs HIFU" "$base/blog/microneedle-rf-vs-monopolar-rf-vs-hifu/" "article"

# 5. Contact page
Test-Url "Contact page" "$base/contact/" "Contact"

# 6. About page
Test-Url "About page" "$base/about/" "BRITZMEDI"

# 7. FAQ page
Test-Url "FAQ page" "$base/faq/" "FAQ"

# 8. Admin login
Test-Url "Admin login" "$base/admin/login" "login"

# 9. Admin pages (will redirect to login, check for 200 or 302)
try {
    $r = Invoke-WebRequest -Uri "$base/admin/" -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 0
    Write-Host "[PASS] Admin dashboard ($($r.StatusCode))"
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'ERR' }
    if ($code -eq 302 -or $code -eq 301) {
        Write-Host "[PASS] Admin dashboard (redirect to login: $code)"
    } else {
        Write-Host "[FAIL] Admin dashboard (Error: $code)"
    }
}

# 10. Sitemap
Test-Url "sitemap-index.xml" "$base/sitemap-index.xml" "sitemap"

# 11. Robots.txt
Test-Url "robots.txt" "$base/robots.txt" "Sitemap"

# 12. Static assets
Test-Url "Hero image" "$base/images/hero/hero-image-1770725014723.webp" $null

# 13. Redirects
try {
    $r = Invoke-WebRequest -Uri "$base/admin/blog-manager" -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 0
    Write-Host "[INFO] blog-manager redirect: $($r.StatusCode)"
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'ERR' }
    if ($code -eq 301 -or $code -eq 302 -or $code -eq 308) {
        Write-Host "[PASS] blog-manager redirect ($code)"
    } else {
        Write-Host "[FAIL] blog-manager redirect ($code)"
    }
}

try {
    $r = Invoke-WebRequest -Uri "$base/admin/youtube-to-blog" -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 0
    Write-Host "[INFO] youtube-to-blog redirect: $($r.StatusCode)"
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'ERR' }
    if ($code -eq 301 -or $code -eq 302 -or $code -eq 308) {
        Write-Host "[PASS] youtube-to-blog redirect ($code)"
    } else {
        Write-Host "[FAIL] youtube-to-blog redirect ($code)"
    }
}

# 14. i18n pages
Test-Url "Japanese homepage" "$base/ja/" "BRITZMEDI"
Test-Url "Chinese homepage" "$base/zh/" "BRITZMEDI"

# 15. Products listing
Test-Url "Products listing" "$base/products/" "Products"

# 16. Resources page
Test-Url "Resources page" "$base/resources/" "Resources"

# 17. API check (blog manifest)

Write-Host ""
Write-Host "=== QA COMPLETE ==="
