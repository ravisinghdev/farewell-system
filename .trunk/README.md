# Trunk Configuration for Farewell System

## Overview
This directory contains the Trunk configuration for linting and formatting the project.

## Important: shadcn/ui Protection

**The Trunk extension is configured to NOT format or lint shadcn/ui components.**

This is intentional to preserve the original formatting and structure of these components.

### Protected Directories:
- `components/ui/**` - All shadcn/ui components
- `.next/**` - Next.js build output
- `out/**` - Static export output
- `android/**` - Capacitor Android build
- `ios/**` - Capacitor iOS build

### How It Works:

1. **`trunk.yaml`** - Contains ignore rules for Prettier and ESLint
2. **`../.prettierignore`** - Excludes protected directories from formatting
3. **`../.prettierrc.js`** - Requires `@format` pragma for UI components

## Testing the Configuration

To verify that shadcn/ui components are protected:

1. Open any file in `components/ui/` (e.g., `button.tsx`)
2. Add extra spaces or formatting changes
3. Save the file
4. Verify that Trunk does NOT auto-format it

## Updating Trunk

If you need to update Trunk, run:
```bash
trunk upgrade
```

## Adding New Ignore Rules

Edit `trunk.yaml` and add paths to the `lint.ignore` section.
