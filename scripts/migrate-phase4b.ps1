param([switch]$WhatIf)

$dirs = @(
  "components/banks",
  "components/payables",
  "components/receivables",
  "components/movements",
  "components/people"
)

$extraFiles = @(
  "components/login-form.tsx",
  "components/sign-up-form.tsx",
  "components/update-password-form.tsx",
  "components/forgot-password-form.tsx",
  "components/admin-invitation-acceptance-form.tsx",
  "components/logout-button.tsx",
  "components/onboarding/organization-onboarding-form.tsx",
  "components/env-var-warning.tsx",
  "app/protected/error.tsx",
  "app/auth/login/page.tsx",
  "app/auth/convite/page.tsx"
)

$files = @()
foreach ($dir in $dirs) {
  $files += Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path $dir | Select-Object -ExpandProperty FullName
}
foreach ($rel in $extraFiles) {
  $abs = Join-Path (Get-Item .).FullName $rel
  if (Test-Path $abs) { $files += $abs }
}

function Replace-Text($content) {
  # ── A. Auth page full gradient backgrounds ──
  $content = $content -replace [regex]::Escape("radial-gradient(circle_at_18%_18%,rgba(139,114,248,0.22),transparent_34%),radial-gradient(circle_at_82%_72%,rgba(29,233,178,0.12),transparent_28%),linear-gradient(135deg,#080810_0%,#0f0b22_48%,#07070c_100%)"), "radial-gradient(circle_at_18%_18%,rgba(198,142,77,0.18),transparent_34%),radial-gradient(circle_at_82%_72%,rgba(198,142,77,0.08),transparent_28%),linear-gradient(135deg,#14110F_0%,#1a1613_48%,#14110F_100%)"
  $content = $content -replace [regex]::Escape("radial-gradient(circle_at_20%_16%,rgba(29,233,178,0.18),transparent_32%),radial-gradient(circle_at_80%_78%,rgba(139,114,248,0.18),transparent_30%),linear-gradient(135deg,#080810_0%,#0d1222_48%,#07070c_100%)"), "radial-gradient(circle_at_20%_16%,rgba(198,142,77,0.15),transparent_32%),radial-gradient(circle_at_80%_78%,rgba(198,142,77,0.12),transparent_30%),linear-gradient(135deg,#14110F_0%,#1a1613_48%,#14110F_100%)"

  # ── B. Auth page step accent colors ──
  $content = $content -replace 'text-\[#5caaff\]', 'text-primary'
  $content = $content -replace 'text-\[#f0506e\]', 'text-ff-destructive'
  $content = $content -replace 'text-\[#1de9b2\]', 'text-ff-success'
  $content = $content -replace 'border-white/10 bg-white/\[0\.025\]', 'border-border bg-ff-bg-soft'
  $content = $content -replace 'border-white/10 bg-white/\[0\.045\]', 'border-border bg-card'
  $content = $content -replace 'bg-\[\#080810\]/65', 'bg-background/65'
  $content = $content -replace 'bg-\[\#080810\]/70', 'bg-background/70'
  $content = $content -replace 'bg-\[\#080810\]/45', 'bg-background/45'

  # ── C. Hero gradients (banks/people) ──
  $content = $content -replace 'bg-\[linear-gradient\(135deg,#07172e_0%,#061020_55%,#080810_100%\)\]', 'bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)]'
  $content = $content -replace 'bg-\[linear-gradient\(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%\)\]', 'bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)]'

  # ── D. Dark: prefixed ──
  $content = $content -replace 'dark:border-white/10', 'border-border'
  $content = $content -replace 'dark:bg-\[\#080810\]', 'bg-background'
  $content = $content -replace 'dark:text-white/80', 'text-foreground'
  $content = $content -replace 'dark:text-white/60', 'text-foreground'
  $content = $content -replace 'dark:text-white/50', 'text-muted-foreground'
  $content = $content -replace 'dark:text-white/40', 'text-muted-foreground'
  $content = $content -replace 'dark:text-white/35', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white/30', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white/25', 'text-ff-subtle-foreground'
  $content = $content -replace 'dark:text-white', 'text-foreground'
  $content = $content -replace 'dark:hover:bg-white/10', 'hover:bg-ff-bg-soft'
  $content = $content -replace 'dark:hover:text-white', 'hover:text-foreground'

  # ── E. #5caaff blue → copper primary ──
  $content = $content -replace 'bg-\[\#5caaff\]/15', 'bg-primary/15'
  $content = $content -replace 'bg-\[\#5caaff\]/10', 'bg-primary/10'
  $content = $content -replace 'text-\[\#5caaff\]', 'text-primary'
  $content = $content -replace 'border-\[\#5caaff\]/20', 'border-primary/20'

  # ── F. backdrop-blur on surfaces (remove) ──
  $content = $content -replace ' backdrop-blur-xl', ''
  $content = $content -replace ' backdrop-blur-sm', ''
  $content = $content -replace ' backdrop-blur', ''

  # ── G. Hover patterns ──
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
  $content = $content -replace 'focus:text-white', 'focus:text-foreground'

  # ── H. Focus/ring ──
  $content = $content -replace 'focus-visible:ring-\[\#8b72f8\]', 'focus-visible:ring-ring'
  $content = $content -replace 'focus-visible:ring-\[\#8b72f8\]/30', 'focus-visible:ring-ring/40'
  $content = $content -replace 'focus:ring-\[\#8b72f8\]', 'focus:ring-ring'
  $content = $content -replace 'focus:ring-\[\#8b72f8\]/30', 'focus:ring-ring/40'

  # ── I. Hex #8b72f8 (with opacity first) ──
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
  $content = $content -replace 'shadow-\[\#8b72f8\]', 'shadow-primary'

  # ── J. #b09cff purple soft ──
  $content = $content -replace 'text-\[\#b09cff\]', 'text-primary'
  $content = $content -replace 'bg-\[\#b09cff\]', 'bg-primary'
  $content = $content -replace 'border-\[\#b09cff\]', 'border-primary'

  # ── K. #1de9b2 neon green → warm sage ──
  $content = $content -replace 'text-\[\#1de9b2\]', 'text-ff-success'
  $content = $content -replace 'bg-\[\#1de9b2\]/20', 'bg-ff-success-soft'
  $content = $content -replace 'bg-\[\#1de9b2\]/10', 'bg-ff-success-soft'
  $content = $content -replace 'bg-\[\#1de9b2\]', 'bg-ff-success-soft'
  $content = $content -replace 'border-\[\#1de9b2\]/15', 'border-ff-success/30'
  $content = $content -replace 'border-\[\#1de9b2\]/20', 'border-ff-success'

  # ── L. #f0506e / #ff8da0 error red → terracotta ──
  $content = $content -replace 'text-\[\#ff8da0\]', 'text-ff-destructive'
  $content = $content -replace 'text-\[\#f0506e\]', 'text-ff-destructive'
  $content = $content -replace 'hover:bg-\[\#f0506e\]/20', 'hover:bg-ff-destructive-soft'
  $content = $content -replace 'hover:bg-\[\#df405f\]', 'hover:bg-ff-destructive/90'
  $content = $content -replace 'bg-\[\#f0506e\]/10', 'bg-ff-destructive-soft'
  $content = $content -replace 'border-\[\#f0506e\]/20', 'border-ff-destructive'
  $content = $content -replace 'bg-\[\#f0506e\]', 'bg-ff-destructive'

  # ── M. #f7b84b warning yellow → mustard ──
  $content = $content -replace 'text-\[\#f7b84b\]', 'text-ff-warning'
  $content = $content -replace 'bg-\[\#f7b84b\]/10', 'bg-ff-warning-soft'
  $content = $content -replace 'bg-\[\#f7b84b\]', 'bg-ff-warning-soft'

  # ── N. #080810 dark bg → ink bg ──
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

  # ── O. Border white/alpha ──
  $content = $content -replace 'border-white/\[0\.15\]', 'border-ff-border-strong'
  $content = $content -replace 'border-white/\[0\.12\]', 'border-border'
  $content = $content -replace 'border-white/\[0\.1\]', 'border-border'
  $content = $content -replace 'border-white/\[0\.08\]', 'border-border'
  $content = $content -replace 'border-white/15', 'border-ff-border-strong'
  $content = $content -replace 'border-white/20', 'border-ff-border-strong'
  $content = $content -replace 'border-white/10', 'border-border'
  $content = $content -replace 'border-white/5', 'border-ff-border-strong'

  # ── P. Background white/alpha ──
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

  # ── Q. Text white/alpha ──
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

  # ── R. Plain text-white (standalone, not followed by / or [) ──
  $content = $content -replace '(?<![a-zA-Z0-9-])text-white(?![\/\[a-zA-Z0-9-])', 'text-foreground'

  # ── S. Placeholder ──
  $content = $content -replace 'placeholder:text-white/\[0\.06\]', 'placeholder:text-ff-subtle-foreground'
  $content = $content -replace 'placeholder:text-white/30', 'placeholder:text-muted-foreground'
  $content = $content -replace 'placeholder:text-white/25', 'placeholder:text-ff-subtle-foreground'
  $content = $content -replace 'placeholder:text-white/20', 'placeholder:text-ff-subtle-foreground'

  # ── T. Shadow patterns ──
  $content = $content -replace 'shadow-\[0_18px_45px_rgba\(139,114,248,0\.35\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_18px_45px_rgba\(139,114,248,0\.28\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_18px_45px_rgba\(139,114,248,0\.18\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_30px_100px_rgba\(0,0,0,0\.45\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_24px_70px_rgba\(0,0,0,0\.34\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_16px_45px_rgba\(0,0,0,0\.22\)\]', 'shadow-ff-md'
  $content = $content -replace 'shadow-\[0_14px_45px_rgba\(0,0,0,0\.3\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_14px_35px_rgba\(0,0,0,0\.25\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.06\),0_16px_45px_rgba\(0,0,0,0\.22\)\]', 'shadow-ff-md'
  $content = $content -replace 'shadow-\[0_22px_70px_rgba\(0,0,0,0\.35\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_28px_90px_rgba\(0,0,0,0\.38\)\]', 'shadow-ff-lg'
  $content = $content -replace 'shadow-\[0_8px_30px_rgba\(0,0,0,0\.25\)\]', 'shadow-ff-md'

  # ── U. Hex #06110f dark green (admin-invitation icon bg) ──
  $content = $content -replace 'text-\[\#06110f\]', 'text-ff-success-foreground'

  # ── V. Special: auth form wrapper card ──
  $content = $content -replace 'rounded-\[2rem\] border border-white/10 bg-white/\[0\.055\] p-5 text-white shadow-\[0_30px_100px_rgba\(0,0,0,0\.45\]\)', 'rounded-[2rem] border-border bg-card p-5 text-foreground shadow-ff-lg'

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
