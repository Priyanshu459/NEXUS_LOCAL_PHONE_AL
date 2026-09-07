$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectRoot = Split-Path $PSScriptRoot -Parent
$voiceFolder = Join-Path $projectRoot '.local-release/video-work'
$tourScenes = Get-Content -LiteralPath (Join-Path $voiceFolder 'scenes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $speaker.SelectVoice('Microsoft Zira Desktop')
    $speaker.Rate = 0
    for ($sceneIndex = 0; $sceneIndex -lt $tourScenes.Count; $sceneIndex++) {
        $audioPath = Join-Path $voiceFolder ('voice-{0:00}.wav' -f $sceneIndex)
        $speaker.SetOutputToWaveFile($audioPath)
        $speaker.Speak($tourScenes[$sceneIndex].speech)
        $speaker.SetOutputToNull()
    }
} finally { $speaker.Dispose() }
Write-Output ('Narrated {0} scenes.' -f $tourScenes.Count)
