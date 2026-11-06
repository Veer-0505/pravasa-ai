# Pravasa AI – Automatic Budget-Based Attraction Selection

This update adds an optional automatic budget optimizer to the existing Trip Planner. Existing pages, admin portal, authentication, language support, and the standard `/api/plan` planner are retained.

## What changed

- `client/src/pages/PlanTrip.jsx`
  - Adds an “Automatically select attractions within my budget” option.
  - Selecting a target destination turns the option on automatically.
  - Uses the new endpoint only when the option is enabled; otherwise the existing planner is unchanged.
  - Displays outbound, sightseeing-loop, return, and total estimated distances in the itinerary.

- `server/routes/plan.js`
  - Adds `POST /api/plan/auto-budget`.

- `server/services/budgetOptimizer.js`
  - Loads published destinations from Supabase; falls back to the existing local destination data if Supabase is not configured/available.
  - Finds attractions in the destination district or within an estimated 35 km road-distance radius.
  - Reserves outbound and return travel, accommodation, food, parking/contingency, and taxes before choosing attractions.
  - Adds attractions only when the recalculated estimated total remains within the user's budget.
  - Orders selected attractions with a nearest-neighbour route heuristic.
  - Includes the return journey to the original starting point in the total distance and transport cost.

- `server/services/pricingService.js`
  - Supports an explicit `totalDistanceKm` input for the new endpoint. Existing pricing calls without that field keep their previous calculation path.

- `server/services/planner.js`
  - Adds Kampli's gateway coordinates for the example Kampli → Bengaluru journey.

## How to use

1. Start the backend and frontend as you normally do.
2. Open **Plan Trip**.
3. Search for and select the destination (for example, a Bengaluru attraction from the destination search).
4. Enter starting point, number of days, travellers, budget, and transport mode.
5. Keep **Automatically select attractions within my budget** checked.
6. Click **Generate Itinerary**.

To use the previous planner instead, uncheck the new option.

## Data and estimate notes

- No database migration is required.
- The optimizer uses the existing destination fields, especially `id`, `name`, `district`, `place_type`, `lat`, `lng`, `entry_fee_inr` / `entryFeeINR`, `is_published`, and categories.
- Missing entry fees are treated as ₹0; verify ticket fees in the Government Admin portal before relying on the estimate.
- Distances use the existing `roadDistanceKm` estimator (Haversine distance multiplied by the project's road factor). They are estimates, not live road-routing or traffic results.
- Bus/train fares, fuel, hotel, food, and contingency costs are estimates from the existing pricing model, not confirmed quotes.
- If the fixed costs alone exceed the budget, the optimizer selects no paid attractions and shows the budget overrun rather than falsely claiming the trip fits.
- For destinations with no published nearby attractions or valid GPS coordinates, publish/update them in the existing Government Admin portal.

## Run

From `server/`:
```bash
npm install
npm run dev
```

From `client/`:
```bash
npm install
npm run dev
```

Keep your existing local `.env` files. They are intentionally not included in this updated ZIP because they may contain private Supabase/API credentials. Use the existing `.env.example` files as reference if setting up a new machine.

## Validation performed

- Node syntax checks passed for the changed backend JavaScript files.
- The changed React JSX parsed successfully.
- The optimizer was exercised against the included local destination dataset for Kampli → Bengaluru with ₹5,000 and ₹10,000 budgets. It included the return journey in both cases and did not select attractions when fixed estimated costs already exceeded the ₹5,000 budget.
- A full Vite production build could not be completed in this environment because the uploaded `node_modules` did not contain Rollup's Linux optional binary. Run `npm install` in your environment before building.
