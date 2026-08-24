// Next 16 no longer ships an ambient declaration for stylesheet imports, so the
// side-effect `import "./globals.css"` in the root layout has no module to resolve.
declare module "*.css"
