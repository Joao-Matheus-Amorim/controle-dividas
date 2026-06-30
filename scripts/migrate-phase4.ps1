param([switch]$WhatIf)

$dirs = @(
  "components/ui",
  "components/app",
  "components/finance",
  "components/admin",
  "components/settings",
  "components/reports",
  "components/expenses",
  "app/onboarding"
)

$files = @()
foreach ($dir in $dirs) {
  $files += Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path $dir | Select-Object -ExpandProperty FullName
}

function Replace-Text($content) {
  # ══════════════════════════════════════════════
  # ORDER: MUST process dark: prefixed patterns FIRST
  # (otherwise non-dark patterns match as substrings)
  # ══════════════════════════════════════════════

  # ── A. DARK: PREFIXED PATTERNS (resolve before non-dark) ──
  $content = $content -replace 'dark:border-white/10', 'border-border'
  $content = $content -replace 'dark:border-white/5', 'border-ff-border-strong'
  $content = $content -replace 'dark:border-white/\[0\.1\]', 'border-border'
  $content = $content -replace 'dark:bg-\[\#080810\]', 'bg-background'
  $content = $content -replace 'dark:bg-\[\#10101a\]', 'bg-card'
  $content = $content -replace 'dark:focus:ring-\[\#8b72f8\]', 'focus-visible:ring-ring/40'
  $content = $content -replace 'dark:focus:ring-white/\[0\.12\]', 'focus:ring-ring/40'
  $content = $content -replace 'dark:focus-visible:border-\[\#8b72f8\]', 'focus-visible:border-ring'
  $content = $content -replace 'dark:focus-visible:ring-ring', 'focus-visible:ring-ring'
  $content = $content -replace 'dark:separator-\[\#080810\]', 'bg-border'
  $content = $content -replace 'dark:text-white/80', 'text-foreground'
  $content = $content -replace 'dark:text-white/60', 'text-foreground'
  $content = $content -replace 'dark:text-white/50', 'text-muted-foreground'
  $content = $content -replace 'dark:text-white/40', 'text-muted-foreground'
  $content = $content -replace 'dark:text-white/35', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white/30', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white/25', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white/20', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white', 'text-foreground'
  $content = $content -replace 'dark:placeholder:text-white/30', 'placeholder:text-muted-foreground'
  $content = $content -replace 'dark:hover:text-white', 'hover:text-foreground'
  $content = $content -replace 'dark:hover:bg-white/10', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'dark:hover:bg-white/5', 'hover:bg-ff-bg-soft'

  # ── B. #5caaff blue accent → copper primary ──
  $content = $content -replace 'bg-\[\#5caaff\]/15', 'bg-primary/15'
  $content = $content -replace 'bg-\[\#5caaff\]/10', 'bg-primary/10'
  $content = $content -replace 'text-\[\#5caaff\]', 'text-primary'
  $content = $content -replace 'border-\[\#5caaff\]/20', 'border-primary/20'

  # ── C. Divide white patterns ──
  $content = $content -replace 'divide-x divide-white/10', 'divide-x divide-border'
  $content = $content -replace 'divide-white/10', 'divide-border'

  # ── D. Complex inline values (gradients, long shadows) ──
  $content = $content -replace 'bg-\[linear-gradient\(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%\)\]', 'bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)]'
  $content = $content -replace 'bg-\[linear-gradient\(135deg,#07172e_0%,#061020_55%,#080810_100%\)\]', 'bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)]'
  $content = $content -replace 'bg-\[linear-gradient\(145deg,rgba\(255,255,255,0\.075\),rgba\(255,255,255,0\.025\)\)\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-\[radial-gradient\(circle_at_top_right,rgba\(139,114,248,0\.13\),transparent_35%\),rgba\(255,255,255,0\.045\)\]', 'bg-card'
  $content = $content -replace 'shadow-\[0_22px_70px_rgba\(0,0,0,0\.35\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_28px_90px_rgba\(0,0,0,0\.38\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_18px_45px_rgba\(139,114,248,0\.28\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_14px_35px_rgba\(139,114,248,0\.18\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.06\),0_16px_45px_rgba\(0,0,0,0\.22\)\]', 'shadow-ff-md'
  $content = $content -replace 'shadow-\[0_24px_70px_rgba\(0,0,0,0\.34\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_16px_45px_rgba\(0,0,0,0\.22\)\]', 'shadow-ff-md'
  $content = $content -replace 'shadow-\[0_14px_45px_rgba\(0,0,0,0\.3\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_14px_45px_rgba\(0,0,0,0\.25\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_8px_30px_rgba\(0,0,0,0\.25\)\]', 'shadow-ff-md'

  # ── E. backdrop-blur on surfaces (remove) ──
  $content = $content -replace ' backdrop-blur-xl', ''
  $content = $content -replace ' backdrop-blur-sm', ''
  $content = $content -replace ' backdrop-blur', ''

  # ── F. Peer-checked / group-hover / hover patterns ──
  $content = $content -replace 'peer-checked:border-\[\#8b72f8\]', 'peer-checked:border-primary'
  $content = $content -replace 'peer-checked:bg-\[\#8b72f8\]', 'peer-checked:bg-primary'
  $content = $content -replace 'peer-checked:text-white', 'peer-checked:text-foreground'
  $content = $content -replace 'group-hover:border-\[\#8b72f8\]', 'group-hover:border-primary'
  $content = $content -replace 'group-hover:text-white', 'group-hover:text-foreground'
  $content = $content -replace 'hover:bg-\[\#7d66e4\]', 'hover:bg-ff-primary-hover'
  $content = $content -replace 'hover:border-white/20', 'hover:border-ff-border-strong'
  $content = $content -replace 'hover:bg-white/\[0\.06\]', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'hover:bg-white/\[0\.055\]', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'hover:bg-white/\[0\.08\]', 'hover:bg-card'
  $content = $content -replace 'hover:bg-white/\[0\.07\]', 'hover:bg-card'
  $content = $content -replace 'hover:bg-white/\[0\.045\]', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'hover:border-\[\#8b72f8\]/35', 'hover:border-primary/35'
  $content = $content -replace 'hover:bg-\[\#8b72f8\]/10', 'hover:bg-primary/10'
  $content = $content -replace 'hover:text-white', 'hover:text-foreground'
  $content = $content -replace 'hover:bg-white/10', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'hover:bg-white/5', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'focus:bg-white/10', 'focus:bg-ff-bg-soft'
  $content = $content -replace 'focus:bg-white/5', 'focus:bg-ff-bg-soft'
  $content = $content -replace 'focus:text-white', 'focus:text-foreground'

  # ── G. Focus/ring patterns ──
  $content = $content -replace 'focus-visible:border-\[\#8b72f8\]', 'focus-visible:border-ring'
  $content = $content -replace 'focus-visible:ring-\[\#8b72f8\]/30', 'focus-visible:ring-ring/40'
  $content = $content -replace 'focus:ring-\[\#8b72f8\]/30', 'focus:ring-ring/40'
  $content = $content -replace 'focus:ring-\[\#8b72f8\]', 'focus:ring-ring'
  # Note: dark:focus:ring was already handled in section A

  # ── H. Ring patterns ──
  $content = $content -replace 'ring-\[\#8b72f8\]/40', 'ring-ring/40'
  $content = $content -replace 'ring-\[\#8b72f8\]/30', 'ring-ring/40'
  $content = $content -replace 'ring-\[\#8b72f8\]', 'ring-ring'

  # ── I. Hex colors WITH opacity modifiers (before base hex) ──
  $content = $content -replace 'bg-\[\#8b72f8\]/15', 'bg-primary/15'
  $content = $content -replace 'bg-\[\#8b72f8\]/10', 'bg-primary/10'
  $content = $content -replace 'bg-\[\#8b72f8\]/20', 'bg-primary/20'
  $content = $content -replace 'bg-\[\#8b72f8\]/5', 'bg-primary/5'
  $content = $content -replace 'border-\[\#8b72f8\]/70', 'border-primary/70'
  $content = $content -replace 'border-\[\#8b72f8\]/50', 'border-primary/50'
  $content = $content -replace 'border-\[\#8b72f8\]/30', 'border-primary/30'
  $content = $content -replace 'border-\[\#8b72f8\]/20', 'border-primary/20'
  $content = $content -replace 'text-\[\#8b72f8\]', 'text-primary'
  $content = $content -replace 'bg-\[\#8b72f8\]', 'bg-primary'
  $content = $content -replace 'border-\[\#8b72f8\]', 'border-primary'
  $content = $content -replace 'from-\[\#8b72f8\]', 'from-primary'
  $content = $content -replace 'via-\[\#8b72f8\]', 'via-primary'
  $content = $content -replace 'to-\[\#8b72f8\]', 'to-primary'
  $content = $content -replace 'shadow-\[\#8b72f8\]', 'shadow-primary'

  # ── J. Purple accent (#b09cff) ──
  $content = $content -replace 'text-\[\#b09cff\]', 'text-primary'
  $content = $content -replace 'bg-\[\#b09cff\]', 'bg-primary'
  $content = $content -replace 'border-\[\#b09cff\]', 'border-primary'

  # ── K. Neon green (#1de9b2) → warm sage ──
  $content = $content -replace 'text-\[\#1de9b2\]', 'text-ff-success'
  $content = $content -replace 'bg-\[\#1de9b2\]/20', 'bg-ff-success-soft'
  $content = $content -replace 'bg-\[\#1de9b2\]/10', 'bg-ff-success-soft'
  $content = $content -replace 'bg-\[\#1de9b2\]', 'bg-ff-success-soft'
  $content = $content -replace 'border-\[\#1de9b2\]/15', 'border-ff-success/30'
  $content = $content -replace 'border-\[\#1de9b2\]/20', 'border-ff-success'

  # ── L. Error red (#f0506e, #ff8da0) → terracotta ──
  $content = $content -replace 'text-\[\#ff8da0\]', 'text-ff-destructive'
  $content = $content -replace 'text-\[\#f0506e\]', 'text-ff-destructive'
  $content = $content -replace 'hover:bg-\[\#f0506e\]/20', 'hover:bg-ff-destructive-soft'
  $content = $content -replace 'hover:bg-\[\#df405f\]', 'hover:bg-ff-destructive/90'
  $content = $content -replace 'bg-\[\#f0506e\]/10', 'bg-ff-destructive-soft'
  $content = $content -replace 'border-\[\#f0506e\]/20', 'border-ff-destructive'
  $content = $content -replace 'bg-\[\#f0506e\]', 'bg-ff-destructive'

  # ── M. Warning yellow (#f7b84b) → mustard ──
  $content = $content -replace 'text-\[\#f7b84b\]', 'text-ff-warning'
  $content = $content -replace 'bg-\[\#f7b84b\]/10', 'bg-ff-warning-soft'
  $content = $content -replace 'bg-\[\#f7b84b\]', 'bg-ff-warning-soft'

  # ── N. Dark backgrounds (#080810, #10101a, #121225) → ink/card ──
  $content = $content -replace 'bg-\[\#121225\]', 'bg-card'
  $content = $content -replace 'bg-\[\#10101a\]', 'bg-card'
  $content = $content -replace 'bg-\[\#080810\]/95', 'bg-background/95'
  $content = $content -replace 'bg-\[\#080810\]/80', 'bg-background/80'
  $content = $content -replace 'bg-\[\#080810\]/70', 'bg-background/70'
  $content = $content -replace 'bg-\[\#080810\]/60', 'bg-background/60'
  $content = $content -replace 'bg-\[\#080810\]/55', 'bg-background/55'
  $content = $content -replace 'bg-\[\#080810\]/50', 'bg-background/50'
  $content = $content -replace 'bg-\[\#080810\]/45', 'bg-background/45'
  $content = $content -replace 'bg-\[\#080810\]/40', 'bg-background/40'
  $content = $content -replace 'bg-\[\#080810\]/30', 'bg-background/30'
  $content = $content -replace 'bg-\[\#080810\]/20', 'bg-background/20'
  $content = $content -replace 'bg-\[\#080810\]/10', 'bg-background/10'
  $content = $content -replace 'bg-\[\#080810\]', 'bg-background'
  $content = $content -replace 'from-\[\#080810\]', 'from-background'
  $content = $content -replace 'via-\[\#080810\]', 'via-background'
  $content = $content -replace 'to-\[\#080810\]', 'to-background'

  # ── O. Border alpha white patterns ──
  $content = $content -replace 'border-white/\[0\.15\]', 'border-ff-border-strong'
  $content = $content -replace 'border-white/\[0\.12\]', 'border-border'
  $content = $content -replace 'border-white/\[0\.1\]', 'border-border'
  $content = $content -replace 'border-white/\[0\.08\]', 'border-border'
  $content = $content -replace 'border-white/15', 'border-ff-border-strong'
  $content = $content -replace 'border-white/20', 'border-ff-border-strong'
  $content = $content -replace 'border-white/10', 'border-border'
  $content = $content -replace 'border-white/5', 'border-ff-border-strong'

  # ── P. Background alpha white patterns ──
  $content = $content -replace 'bg-white/\[0\.03\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.035\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.045\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.04\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.05\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.055\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.06\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.065\]', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/\[0\.075\]', 'bg-card'
  $content = $content -replace 'bg-white/\[0\.07\]', 'bg-card'
  $content = $content -replace 'bg-white/\[0\.08\]', 'bg-card'
  $content = $content -replace 'bg-white/5', 'bg-ff-bg-soft'
  $content = $content -replace 'bg-white/20', 'bg-card'
  $content = $content -replace 'bg-white/10', 'bg-card'
  $content = $content -replace 'bg-white/15', 'bg-card'

  # ── Q. Text alpha white patterns ──
  $content = $content -replace 'text-white/90', 'text-foreground'
  $content = $content -replace 'text-white/85', 'text-foreground'
  $content = $content -replace 'text-white/80', 'text-foreground'
  $content = $content -replace 'text-white/75', 'text-foreground'
  $content = $content -replace 'text-white/70', 'text-foreground'
  $content = $content -replace 'text-white/65', 'text-foreground'
  $content = $content -replace 'text-white/60', 'text-foreground'
  $content = $content -replace 'text-white/55', 'text-foreground'
  $content = $content -replace 'text-white/50', 'text-muted-foreground'
  $content = $content -replace 'text-white/45', 'text-muted-foreground'
  $content = $content -replace 'text-white/40', 'text-muted-foreground'
  $content = $content -replace 'text-white/35', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/30', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/28', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/25', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/20', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/15', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/10', 'text-ff-subtle-foreground'
  $content = $content -replace 'text-white/5', 'text-ff-subtle-foreground'

  # ── R. Plain text-white (standalone) ──
  $content = $content -replace '(?<![a-zA-Z0-9-])text-white(?![\/\[a-zA-Z0-9-])', 'text-foreground'

  # ── S. Placeholder patterns ──
  $content = $content -replace 'placeholder:text-white/\[0\.06\]', 'placeholder:text-ff-subtle-foreground'
  $content = $content -replace 'placeholder:text-white/30', 'placeholder:text-muted-foreground'
  $content = $content -replace 'placeholder:text-white/25', 'placeholder:text-ff-subtle-foreground'
  $content = $content -replace 'placeholder:text-white/20', 'placeholder:text-ff-subtle-foreground'

  # ── T. Misc alpha shadows ──
  $content = $content -replace 'shadow-white/\[0\.03\]', 'shadow-ff-xs'
  $content = $content -replace 'shadow-white/\[0\.05\]', 'shadow-ff-xs'

  return $content
}

$totalModified = 0
foreach ($file in $files) {
  $original = Get-Content -LiteralPath $file -Raw
  $modified = Replace-Text $original
  if ($original -ne $modified) {
    $totalModified++
    if (-not $WhatIf) {
      $modified | Set-Content -LiteralPath $file -NoNewline
    }
    Write-Host "[$(if($WhatIf){'WOULD'}else{'OK'})] $file"
  }
}

Write-Host "`nTotal files modified: $totalModified"
