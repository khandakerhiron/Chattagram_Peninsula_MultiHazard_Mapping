# 🌏 Chattagram Peninsula Multi-Hazard Mapping

**Multi-Criteria Decision Analysis (MCDA) based Landslide Susceptibility and Flood Risk Assessment
for the Chattagram (Chittagong) Peninsula, Bangladesh**

> 🚧 This project is under active development. Upcoming updates will include
> exposure analysis of critical infrastructure (schools, hospitals, shelters, roads).

---

## 📌 Overview

This project assesses **landslide susceptibility** and **flood risk** at the Upazila level
across the Chattagram Division of Bangladesh using the **Analytic Hierarchy Process (AHP)**
— a Multi-Criteria Decision Analysis (MCDA) technique — implemented in **Google Earth Engine (GEE)**.

Results are visualised through an interactive GEE web application allowing users to explore
risk classifications and census-based demographic data for each Upazila.

🔗 **Live App:** [Chattagram Peninsula Multi-Hazard Mapping]([https://your-username.users.earthengine.app/view/your-app-name](https://custom-mix-458510-j8.projects.earthengine.app/view/chattagram-peninsula-multi-hazard-mapping))

---

## 🗺️ Study Area

- **Region:** Chattagram Division, Bangladesh
- **Administrative Unit:** Upazila (sub-district)
- **Districts covered:** Bandarban, Chattogram, Cox's Bazar, Khagrachhari, Rangamati

---

## 📦 Data Sources

### Landslide Susceptibility — Input Layers

| Layer | Source |
|---|---|
| Geology | USGS |
| Max Deformation (SAR) | Sentinel-1 SAR |
| Mean Deformation (SAR) | Sentinel-1 SAR |
| Elevation | SRTM DEM |
| Slope | Derived from SRTM DEM |
| Aspect | Derived from SRTM DEM |
| Soil | Bangladesh Agricultural Research Council (BARC) Map Portal |
| Rainfall | CHIRPS |
| NDVI | Landsat 9 |
| Land Use / Land Cover (LULC) | Dynamic World Land Cover |
| Distance from River | HydroSHEDS River Network |
| Distance from Faults | NASA Fault Data |
| Distance from Roads | OpenStreetMap (OSM) |

### Flood Risk Assessment — Input Layers

| Layer | Source |
|---|---|
| Curvature | Derived from DEM |
| Topographic Wetness Index (TWI) | Derived from DEM |
| Elevation | SRTM DEM |
| Slope | Derived from DEM |
| Soil | BARC Map Portal |
| Rainfall | CHIRPS |
| NDVI | Landsat 9 |
| Land Use / Land Cover (LULC) | Dynamic World Land Cover |
| Distance from River | HydroSHEDS River Network |
| Stream Power Index (SPI) | Derived from DEM |
| Distance from Roads | OpenStreetMap (OSM) |

---

## ⚙️ Methodology

### Workflow
```
Raw Layers
    ↓
Projection (UTM Zone 46N)
    ↓
Clip to Study Area
    ↓
Resample to 30 m resolution
    ↓
Reclassification (1–5 risk scale)
    ↓
AHP Pairwise Comparison Matrix
    ↓
Weighted Overlay
    ↓
Risk Classification (Very Low → Very High)
    ↓
Upazila-level Zonal Statistics
    ↓
GEE Interactive App
```

### Analytic Hierarchy Process (AHP)

#### Landslide Susceptibility — AHP Weights

| Factor | Weight |
|---|---|
| Slope | 0.1904 |
| Max SAR Deformation | 0.1348 |
| Mean SAR Deformation | 0.1348 |
| Distance from Faults | 0.1176 |
| Rainfall | 0.0989 |
| Geology | 0.0847 |
| Soil | 0.0627 |
| Elevation | 0.0435 |
| LULC | 0.0338 |
| Distance from Roads | 0.0332 |
| Distance from River | 0.0276 |
| Aspect | 0.0202 |
| NDVI | 0.0179 |

**Consistency Check**
- λ_max = 13.4393
- Consistency Index (CI) = 0.0366
- Random Index (RI, n=13) = 1.49
- **Consistency Ratio (CR) = 0.0246 ✅ CONSISTENT (CR < 0.1)**

---

#### Flood Risk Assessment — AHP Weights

| Factor | Weight |
|---|---|
| Distance from River | 0.2568 |
| Rainfall | 0.1800 |
| Elevation | 0.1275 |
| Slope | 0.0801 |
| Soil | 0.0796 |
| TWI | 0.0630 |
| SPI | 0.0727 |
| LULC | 0.0430 |
| Distance from Roads | 0.0430 |
| Curvature | 0.0283 |
| NDVI | 0.0260 |

**Consistency Check**
- λ_max = 11.2936
- Consistency Index (CI) = 0.0294
- Random Index (RI, n=11) = 1.49
- **Consistency Ratio (CR) = 0.0197 ✅ CONSISTENT (CR < 0.1)**

---

## 🖥️ GEE App Features

- 🏔️ Landslide risk choropleth map (dominant class per Upazila)
- 🌊 Flood risk choropleth map (dominant class per Upazila)
- 🔁 Layer toggle panel with opacity slider
- 👆 Click any Upazila to view:
  - Risk distribution bar charts (% and km² per class)
  - Census demographics (Population, Households, Male/Female, HH Size)
  - Literacy rates (Total, Male, Female) — *Source: BBS Census 2022*
- 🗺️ Hybrid satellite basemap

---

## 📊 Census Data

Demographic and literacy data at Upazila level sourced from:

> Bangladesh Bureau of Statistics (BBS).
> *Population and Housing Census 2022, National Report Volume I*, Table P35.
> Published November 2023.

---

## 📁 Repository Structure
```
📦 chattagram-multihazard-mapping
 ┣ 📜 README.md
 ┣ 📂 GEE_Scripts
 ┃ ┣ 📜 landslide_susceptibility.js
 ┃ ┣ 📜 flood_risk.js
 ┃ ┗ 📜 interactive_app.js
 ┣ 📂 AHP
 ┃ ┣ 📜 AHP_Landslide.xlsx
 ┃ ┗ 📜 AHP_Flood.xlsx
 ┣ 📂 Data
 ┃ ┗ 📜 Census2022_Upazila_Data.xlsx
 ┗ 📂 Outputs
   ┣ 📜 Landslide_Risk_Map.png
   ┗ 📜 Flood_Risk_Map.png
```

---

## 🔧 How to Use

1. Open the [GEE App link](https://custom-mix-458510-j8.projects.earthengine.app/view/chattagram-peninsula-multi-hazard-mapping)
2. Use the **Layer Controls** panel (top-left) to toggle between Landslide and Flood risk layers
3. Adjust opacity using the slider
4. Click any Upazila to see detailed risk and demographic information

To run the scripts yourself in GEE:
1. Import your shapefile as `studyArea` in GEE Assets
2. Open `GEE_Scripts/interactive_app.js` in the GEE Code Editor
3. Click **Run**

---

## ⚠️ Limitations & Future Work

- [ ] Validation against historical hazard event records
- [ ] Exposure analysis — schools, hospitals, shelters, roads in high-risk zones
- [ ] Temporal change detection using multi-year SAR deformation data
- [ ] Integration of population density raster for vulnerability mapping
- [ ] Field verification of classified risk zones

---

## 👤 Author

Hiron Khandaker
Graduate Student
Department of Geography and Environment
University of Dhaka

---

## 📄 License

This project is licensed under the MIT License.
Data layers retain the licenses of their original sources (USGS, NASA, CHIRPS, OSM, BBS).
