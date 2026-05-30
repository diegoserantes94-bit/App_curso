$port = if ($env:PORT) { [int]$env:PORT } else { 3456 }
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css'
  '.js'   = 'application/javascript'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

$tcp = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$tcp.Start()
Write-Host "Serving $root on http://localhost:$port/"

while ($true) {
  try {
    $client = $tcp.AcceptTcpClient()
    $stream = $client.GetStream()

    # Leer la request line
    $buf    = New-Object byte[] 4096
    $read   = $stream.Read($buf, 0, $buf.Length)
    $reqTxt = [Text.Encoding]::ASCII.GetString($buf, 0, $read)
    $line   = ($reqTxt -split "`r`n")[0]   # ej: "GET /index.html HTTP/1.1"
    $parts  = $line -split ' '
    $urlPath = if ($parts.Count -ge 2) { $parts[1] } else { '/' }

    # Resolver ruta de archivo
    $relPath = $urlPath.TrimStart('/').Split('?')[0]
    if ($relPath -eq '') { $relPath = 'index.html' }
    $filePath = Join-Path $root $relPath

    if (Test-Path $filePath -PathType Leaf) {
      $ext      = [IO.Path]::GetExtension($filePath).ToLower()
      $ct       = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      $body     = [IO.File]::ReadAllBytes($filePath)
      $headers  = "HTTP/1.0 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    } else {
      $body     = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
      $headers  = "HTTP/1.0 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    }

    $hBytes = [Text.Encoding]::ASCII.GetBytes($headers)
    $stream.Write($hBytes, 0, $hBytes.Length)
    $stream.Write($body,   0, $body.Length)
    $stream.Flush()
    $client.Close()
  } catch {
    Write-Host "Error: $_"
  }
}
