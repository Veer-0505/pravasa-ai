# Pravasa AI map and destination-photo fixes

This update preserves the existing React/Supabase application and adds these corrections:

1. Replaced the empty district SVG map. The district metadata had no SVG `path` values, while the component only rendered `district.path`; the result was a blank grey box. The replacement uses Leaflet + OpenStreetMap tiles and the existing 31 district headquarters coordinates as selectable markers. Markers are explicitly not district boundary polygons.
2. Removed generic Unsplash category photos that were being displayed as if they represented a particular destination. Missing, blocked, or failed images now show a neutral `Photo unavailable` placeholder instead of a misleading photo.
3. Rewrote `thumb.wikimedia.org` image hosts to `upload.wikimedia.org` where the same Wikimedia path is used. Failed Wikimedia URLs still fall back to the neutral placeholder.
4. Replaced fake repeated district banner photos with `null`.
5. Preserved the existing admin-uploaded images and Supabase storage URLs unless they are known generic stock placeholders.

## Run locally

```bash
cd client
npm install
npm run dev
```

Run the server in a separate terminal using the existing server instructions. Keep your existing `.env` values outside this archive and do not overwrite them.

## Notes

- OpenStreetMap tiles require internet access and are subject to the OpenStreetMap tile usage policy.
- District map markers represent district headquarters, not official district boundaries.
- This update does not fabricate missing photos. To show a real photo, upload a destination-specific image through the existing admin portal or add a verified Wikimedia/official image URL with attribution.
