param(
    [string]$PythonExe = ""
)

$ErrorActionPreference = 'Stop'

function Get-PythonExe {
    if ($PythonExe -and (Test-Path $PythonExe)) {
        return $PythonExe
    }

    $venvPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
    if (Test-Path $venvPython) {
        return $venvPython
    }

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return 'py'
    }

    return 'python'
}

function Has-NvidiaGpu {
    try {
        $gpus = Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name
        return ($gpus -match 'NVIDIA') -ne $null
    } catch {
        return $false
    }
}

$python = Get-PythonExe
$hasNvidia = Has-NvidiaGpu

Write-Host "Python: $python"
Write-Host "NVIDIA GPU detected: $hasNvidia"

if ($hasNvidia) {
    Write-Host 'Installing CUDA-enabled PyTorch wheels...'
    & $python -m pip install --upgrade pip
    & $python -m pip install --index-url https://download.pytorch.org/whl/cu121 torch torchvision
} else {
    Write-Host 'Installing CPU PyTorch wheels...'
    & $python -m pip install --upgrade pip
    & $python -m pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
}

Write-Host 'Installing project requirements...'
& $python -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')

Write-Host 'Done.'