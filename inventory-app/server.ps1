# server.ps1 - Lightweight static HTTP server for Smart Inventory Management System
param(
    [int]$Port = 8000,
    [string]$Directory = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'

# Try preferred port, or fall back to an available port
$listener = New-Object System.Net.HttpListener

function Test-PortAvailable([int]$p) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    return ($null -eq $conns)
}

if (-not (Test-PortAvailable $Port)) {
    $Port = 8080
    if (-not (Test-PortAvailable $Port)) {
        $Port = 8888
    }
}

$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Error "Failed to start HttpListener on $prefix : $_"
    exit 1
}

Write-Host "====================================================" -ForegroundColor Green
Write-Host "  Smart Inventory Management System is running!     " -ForegroundColor Cyan
Write-Host "  URL: $prefix" -ForegroundColor Yellow
Write-Host "  Serving files from: $Directory" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host "====================================================" -ForegroundColor Green

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".mjs"   = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".txt"   = "text/plain; charset=utf-8"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $rawPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ($rawPath -eq '/' -or [string]::IsNullOrWhiteSpace($rawPath)) {
                $rawPath = '/index.html'
            }

            $relativePath = $rawPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $targetPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Directory, $relativePath))

            # Security check: prevent directory traversal outside $Directory
            $normalizedBase = [System.IO.Path]::GetFullPath($Directory)
            if (-not $targetPath.StartsWith($normalizedBase, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
                $msg = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
            } elseif (Test-Path $targetPath -PathType Container) {
                # Directory requested, check for index.html
                $indexFile = [System.IO.Path]::Combine($targetPath, "index.html")
                if (Test-Path $indexFile -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($indexFile)
                    $response.ContentType = "text/html; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                    $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                    $response.ContentLength64 = $msg.Length
                    $response.OutputStream.Write($msg, 0, $msg.Length)
                }
            } elseif (Test-Path $targetPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($targetPath)
                $ext = [System.IO.Path]::GetExtension($targetPath).ToLower()
                $ctype = $mimeTypes[$ext]
                if (-not $ctype) { $ctype = "application/octet-stream" }
                $response.ContentType = $ctype
                $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
            # Client aborted or error writing response
        } finally {
            try { $response.OutputStream.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
