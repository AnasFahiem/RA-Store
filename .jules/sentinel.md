
## 2024-05-20 - Parameter Tampering in createBundle
**Vulnerability:** The `createBundle` server action accepted `priceOverride` and `type` fields directly from the client without verifying if the user had authorization to set them. This allowed normal users (who are allowed to create 'user_custom' bundles) to inject a custom price or create 'admin_fixed' bundles, leading to price manipulation.
**Learning:** Functions that serve multiple roles must internally validate which parameters are allowed based on the user's role, instead of blindly trusting the client input schema. The schema itself only validates data types, not business logic permissions.
**Prevention:** In mixed-role endpoints, explicitly filter out privileged fields (like price overrides or admin flags) unless an explicit role check (e.g., `session?.role === 'admin' || session?.role === 'owner'`) passes.
