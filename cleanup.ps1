# Delete all .js and .map files inside src/renderer
$targetPath = "src/renderer"

# Get all .js and .map files recursively
$files = Get-ChildItem -Path $targetPath -Include *.js, *.map -Recurse -File

foreach ($file in $files) {
    Write-Host "Deleting $($file.FullName)"
    Remove-Item $file.FullName -Force
}

Write-Host "Cleanup complete. Deleted $($files.Count) files."
