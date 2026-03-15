"""
=============================================================================
 Disaster Risk POI Extractor – Chattagram, Bandarban, Rangamati, Cox's Bazar
=============================================================================
Fetches: Schools, Mosques, Shelters, Rohingya Refugee Camps,
         Hospitals, Police Stations, Fire Stations, Community Centres
Outputs: Interactive matplotlib map + Shapefiles (.shp) per category
=============================================================================
"""

# ── 0. Install / imports ──────────────────────────────────────────────────
import subprocess, sys

def pip_install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

for pkg in ["osmnx", "geopandas", "shapely"]:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        pip_install(pkg)

import osmnx as ox
import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import warnings, os, zipfile
warnings.filterwarnings("ignore")

ox.settings.log_console = False
ox.settings.use_cache   = True

# ── 1. Study-area districts (with fallback aliases) ───────────────────────
DISTRICTS = [
    "Chattogram District, Bangladesh",
    "Bandarban, Chittagong Division, Bangladesh",
    "Rangamati, Chittagong Division, Bangladesh",
    "Cox's Bazar District, Bangladesh",
]

DISTRICT_ALIASES = {
    "Bandarban, Chittagong Division, Bangladesh": [
        "Bandarban Hill District, Bangladesh",
        "Bandarban Sadar Upazila, Bangladesh",
        "বান্দরবান জেলা, Bangladesh",
    ],
    "Rangamati, Chittagong Division, Bangladesh": [
        "Rangamati Hill District, Bangladesh",
        "Rangamati Sadar Upazila, Bangladesh",
        "রাঙামাটি জেলা, Bangladesh",
    ],
}

def geocode_with_fallback(query):
    """Try primary query then aliases; return (short_name, boundary_gdf)."""
    short    = query.split(",")[0]
    attempts = [query] + DISTRICT_ALIASES.get(query, [])
    for attempt in attempts:
        try:
            gdf = ox.geocode_to_gdf(attempt)
            if not gdf.empty:
                print(f"   ✓ Geocoded as: '{attempt}'")
                return short, gdf
        except Exception:
            continue
    print(f"   ✗ All variants failed for {short}")
    return short, None

# ── 2. OSM tag definitions ────────────────────────────────────────────────
CATEGORIES = {
    "School":           ({"amenity": ["school", "kindergarten", "college", "university"]},
                         "#2196F3", "s"),
    "Mosque":           ({"amenity": "place_of_worship", "religion": "muslim"},
                         "#4CAF50", "^"),
    "Shelter":          ({"amenity": ["shelter", "social_facility"],
                          "social_facility": ["shelter", "refugee"]},
                         "#FF9800", "D"),
    "Rohingya_Camp":    ({"refugee": True,
                          "place": ["camp", "locality"]},
                         "#E91E63", "*"),
    "Hospital_Clinic":  ({"amenity": ["hospital", "clinic", "doctors", "pharmacy"]},
                         "#F44336", "+"),
    "Police_Station":   ({"amenity": "police"},
                         "#9C27B0", "P"),
    "Fire_Station":     ({"amenity": "fire_station"},
                         "#FF5722", "8"),
    "Community_Centre": ({"amenity": ["community_centre", "social_centre"]},
                         "#00BCD4", "o"),
}

# ── 3. Helper: fetch & convert to points ─────────────────────────────────
def fetch_features(polygon, tags: dict) -> gpd.GeoDataFrame:
    try:
        gdf = ox.features_from_polygon(polygon, tags=tags)
        if gdf.empty:
            return gpd.GeoDataFrame()
        keep = [c for c in ["name", "amenity", "religion", "operator",
                             "social_facility", "refugee", "place",
                             "addr:full", "geometry"] if c in gdf.columns]
        gdf = gdf[keep].copy()
        gdf["geometry"] = gdf["geometry"].centroid
        gdf = gdf[gdf["geometry"].notna()]
        gdf = gdf.set_crs(epsg=4326, allow_override=True)
        return gdf
    except Exception as e:
        print(f"    ⚠  Skipped ({e})")
        return gpd.GeoDataFrame()

# ── 4. Geocode districts & collect POIs ──────────────────────────────────
print("=" * 60)
print("  Fetching district boundaries …")
print("=" * 60)

district_gdfs  = {}
poi_collection = {cat: [] for cat in CATEGORIES}

for district in DISTRICTS:
    short = district.split(",")[0]
    print(f"\n▶  {short}")

    short, boundary_gdf = geocode_with_fallback(district)
    if boundary_gdf is None:
        continue

    polygon = boundary_gdf.geometry.iloc[0]
    district_gdfs[short] = boundary_gdf

    for cat, (tags, colour, marker) in CATEGORIES.items():
        print(f"   Fetching {cat:<22}", end=" … ")
        gdf = fetch_features(polygon, tags)
        if not gdf.empty:
            gdf["district"] = short
            gdf["category"] = cat
            poi_collection[cat].append(gdf)
            print(f"{len(gdf):>4} features")
        else:
            print("     0 features")

# ── 5. Merge per category ─────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Merging …")

all_poi_gdfs = {}
for cat, gdfs in poi_collection.items():
    if gdfs:
        merged = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs="EPSG:4326")
        all_poi_gdfs[cat] = merged
        print(f"  {cat:<24}: {len(merged):>4} total points")

# ── 6. Combined boundary ──────────────────────────────────────────────────
combined_boundary = gpd.GeoDataFrame(
    pd.concat(list(district_gdfs.values()), ignore_index=True), crs="EPSG:4326"
)

# ── 7. Map visualisation ──────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Plotting map …")

fig, ax = plt.subplots(1, 1, figsize=(14, 16))
fig.patch.set_facecolor("#0D1B2A")
ax.set_facecolor("#0D1B2A")

combined_boundary.boundary.plot(ax=ax, color="#4FC3F7", linewidth=1.2, alpha=0.8)
combined_boundary.plot(ax=ax, color="#1A2E40", alpha=0.4)

for _, row in combined_boundary.iterrows():
    cx = row.geometry.centroid.x
    cy = row.geometry.centroid.y
    ax.text(cx, cy, row.get("name", ""), fontsize=8, color="#B0BEC5",
            ha="center", va="center", fontstyle="italic")

legend_patches = []
for cat, (tags, colour, marker) in CATEGORIES.items():
    if cat not in all_poi_gdfs:
        continue
    gdf = all_poi_gdfs[cat]
    ax.scatter(gdf.geometry.x, gdf.geometry.y,
               c=colour, marker=marker, s=18, alpha=0.75,
               linewidths=0.3, edgecolors="white", zorder=5)
    legend_patches.append(
        mpatches.Patch(color=colour,
                       label=f"{cat.replace('_', ' ')} ({len(gdf)})")
    )

ax.legend(handles=legend_patches, loc="lower left", fontsize=8,
          framealpha=0.85, facecolor="#1A2E40", labelcolor="white",
          edgecolor="#4FC3F7", title="Category (count)", title_fontsize=9)

ax.set_title(
    "Disaster-Risk Sensitive Points of Interest\n"
    "Chattogram  |  Bandarban  |  Rangamati  |  Cox's Bazar",
    fontsize=14, color="white", pad=14, fontweight="bold"
)
ax.tick_params(colors="#607D8B")
for spine in ax.spines.values():
    spine.set_edgecolor("#263238")

plt.tight_layout()
plt.savefig("/kaggle/working/disaster_poi_map.png", dpi=180,
            bbox_inches="tight", facecolor=fig.get_facecolor())
plt.show()
print("  ✓ Map saved → disaster_poi_map.png")

# ── 8. Export shapefiles ──────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Exporting shapefiles …")

output_dir = "/kaggle/working/shapefiles"
os.makedirs(output_dir, exist_ok=True)

def safe_shp_cols(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Truncate column names to ≤10 chars; stringify list/dict cells."""
    gdf = gdf.copy()
    gdf.columns = [c[:10] for c in gdf.columns]
    for col in gdf.columns:
        if col == "geometry":
            continue
        gdf[col] = gdf[col].apply(
            lambda v: str(v)[:254] if isinstance(v, (list, dict)) else v
        )
    return gdf

zip_path = "/kaggle/working/disaster_poi_shapefiles.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for cat, gdf in all_poi_gdfs.items():
        folder = os.path.join(output_dir, cat)
        os.makedirs(folder, exist_ok=True)
        out_path = os.path.join(folder, f"{cat}.shp")
        safe_shp_cols(gdf).to_file(out_path)
        for ext in [".shp", ".shx", ".dbf", ".prj", ".cpg"]:
            fp = out_path.replace(".shp", ext)
            if os.path.exists(fp):
                zf.write(fp, arcname=f"{cat}/{cat}{ext}")
        print(f"  ✓ {cat:<24} → {cat}/{cat}.shp")

print(f"\n  📦 Zipped → /kaggle/working/disaster_poi_shapefiles.zip")

# ── 9. Summary table ──────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  SUMMARY")
print("=" * 60)

rows = []
for cat, gdf in all_poi_gdfs.items():
    dist_counts = gdf["district"].value_counts().to_dict()
    rows.append({"Category": cat.replace("_", " "), "Total": len(gdf), **dist_counts})

summary_df = pd.DataFrame(rows).fillna(0)
int_cols   = [c for c in summary_df.columns if c != "Category"]
summary_df[int_cols] = summary_df[int_cols].astype(int)

print(summary_df.to_string(index=False))
summary_df.to_csv("/kaggle/working/poi_summary.csv", index=False)

print("\n  ✓ Summary saved → poi_summary.csv")
print("=" * 60)
print("  DONE — all outputs in /kaggle/working/")
print("  Files:")
print("    • disaster_poi_map.png")
print("    • disaster_poi_shapefiles.zip")
print("    • poi_summary.csv")
print("=" * 60)
