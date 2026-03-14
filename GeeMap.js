// ============================================================
//   INTERACTIVE LANDSLIDE & FLOOD RISK MAP
//   Import your shapefile as: studyArea
// ============================================================

// ── 0. CENTRE MAP ────────────────────────────────────────────
Map.centerObject(studyArea, 8);
Map.setOptions('HYBRID');


// ============================================================
// 1. COLOUR PALETTES
// ============================================================
var riskPalette  = ['#1a9850','#91cf60','#fee08b','#fc8d59','#d73027'];
var floodPalette = ['#08306b','#2171b5','#6baed6','#f16913','#a50026'];

var riskLabels  = ['Very Low','Low','Moderate','High','Very High'];

var riskFields     = ['L1_Perc','L2_Perc','L3_Perc','L4_Perc','L5_Perc'];
var floodFields    = ['F1_Perc','F2_Perc','F3_Perc','F4_Perc','F5_Perc'];
var riskAbsFields  = ['L1','L2','L3','L4','L5'];
var floodAbsFields = ['F1','F2','F3','F4','F5'];


// ============================================================
// 2. DERIVED DOMINANT CLASS
// ============================================================
var addDominant = function(feature) {

  var lVals = riskFields.map(function(f) { return ee.Number(feature.get(f)); });
  var fVals = floodFields.map(function(f) { return ee.Number(feature.get(f)); });

  var lList = ee.List(lVals);
  var fList = ee.List(fVals);

  var lMax   = lList.reduce(ee.Reducer.max());
  var fMax   = fList.reduce(ee.Reducer.max());
  var lClass = lList.indexOf(lMax).add(1);
  var fClass = fList.indexOf(fMax).add(1);

  return feature.set({ dom_land: lClass, dom_flood: fClass });
};

var studyArea2 = studyArea.map(addDominant);


// ============================================================
// 3. VISUALISATION HELPERS
// ============================================================
var classColour = function(feature, field, palette) {
  var cls = ee.Number(feature.get(field)).subtract(1);
  var hex = ee.List(palette).get(cls);
  return feature.set('style', { fillColor: hex, color: '#333333', width: 0.5 });
};

var landLayer  = studyArea2.map(function(f) { return classColour(f, 'dom_land',  riskPalette);  });
var floodLayer = studyArea2.map(function(f) { return classColour(f, 'dom_flood', floodPalette); });

Map.addLayer(
  landLayer.style({styleProperty: 'style'}),
  {interactive: false},
  '🏔 Landslide Risk (Dominant Class)', true, 0.85
);
Map.addLayer(
  floodLayer.style({styleProperty: 'style'}),
  {interactive: false},
  '🌊 Flood Risk (Dominant Class)', false, 0.85
);
Map.addLayer(
  studyArea.style({fillColor: '00000000', color: '#ffffff', width: 1}),
  {interactive: false},
  '— Upazila Boundaries', true, 1
);


// ============================================================
// 4. LEGENDS
// ============================================================
var makeLegend = function(title, palette, labels, position) {

  var panel = ui.Panel({
    style: {
      position: position,
      padding: '8px 12px',
      backgroundColor: 'rgba(255,255,255,0.92)',
      border: '1px solid #ccc',
      margin: '4px'
    }
  });

  panel.add(ui.Label({
    value: title,
    style: { fontWeight: 'bold', fontSize: '13px', margin: '0 0 6px 0' }
  }));

  for (var i = 0; i < palette.length; i++) {
    var row = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal'),
      style: { margin: '2px 0' }
    });
    row.add(ui.Label({
      style: {
        backgroundColor: palette[i],
        padding: '8px',
        margin: '0 6px 0 0',
        border: '2px solid #444'
      }
    }));
    row.add(ui.Label({
      value: labels[i],
      style: { fontSize: '12px', margin: '2px 0' }
    }));
    panel.add(row);
  }

  return panel;
};

Map.add(makeLegend('🏔 Landslide Risk', riskPalette,  riskLabels, 'bottom-left'));
Map.add(makeLegend('🌊 Flood Risk',     floodPalette, riskLabels, 'bottom-right'));


// ============================================================
// 5. LAYER TOGGLE PANEL  (top-left)
// ============================================================
var togglePanel = ui.Panel({
  style: {
    position: 'top-left',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: '1px solid #ccc'
  }
});

togglePanel.add(ui.Label('🗺 Layer Controls', {
  fontWeight: 'bold', fontSize: '13px'
}));

var layerNames = [
  '🏔 Landslide Risk',
  '🌊 Flood Risk',
  '— Upazila Boundaries'
];

layerNames.forEach(function(name, i) {
  var cb = ui.Checkbox({
    label: name,
    value: i !== 1,   // flood hidden by default
    onChange: function(val) { Map.layers().get(i).setShown(val); },
    style: { fontSize: '12px', margin: '2px 0' }
  });
  togglePanel.add(cb);
});

togglePanel.add(ui.Label('Opacity', {
  fontSize: '11px', margin: '6px 0 2px 0'
}));

var opacitySlider = ui.Slider({
  min: 0.1, max: 1, value: 0.85, step: 0.05,
  onChange: function(val) {
    Map.layers().get(0).setOpacity(val);
    Map.layers().get(1).setOpacity(val);
  },
  style: { stretch: 'horizontal' }
});

togglePanel.add(opacitySlider);

// ── "Click to see details" hint inside toggle panel ──────────
togglePanel.add(ui.Label('─────────────────────', {
  fontSize: '9px', color: '#aaaaaa', margin: '6px 0 4px 0'
}));

togglePanel.add(ui.Label('👆 Click any Upazila', {
  fontSize: '11px', color: '#1a6bb5', fontWeight: 'bold', margin: '0 0 1px 0'
}));

togglePanel.add(ui.Label('to see details →', {
  fontSize: '11px', color: '#555555', margin: '0'
}));

Map.add(togglePanel);


// ============================================================
// 6. INFO PANEL  (top-right)
// ============================================================
var infoPanel = ui.Panel({
  style: {
    position: 'top-right',
    width: '440px',
    padding: '10px',
    backgroundColor: 'rgba(15,15,30,0.93)',
    border: '2px solid #00e5ff'
  }
});

// Default "waiting" label shown before any click
infoPanel.add(ui.Label('👆 Click an Upazila to explore', {
  fontWeight: 'bold', fontSize: '14px', color: '#00e5ff',
  margin: '0 0 8px 0', backgroundColor: 'rgba(0,0,0,0)'
}));

Map.add(infoPanel);


// ============================================================
// 7. NUMBER FORMAT HELPER
// ============================================================
function comma(x) {
  if (x === null || x === undefined) return 'N/A';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


// ============================================================
// 8. BAR CHART + DEMOGRAPHICS POPUP
// ============================================================
var makeBarChart = function(feature) {

  infoPanel.clear();

  var name   = feature.get('THANA_NAME');
  var area   = ee.Number(feature.get('Shape_Area'));

  var lPercs = riskFields.map(function(f)     { return ee.Number(feature.get(f)); });
  var fPercs = floodFields.map(function(f)    { return ee.Number(feature.get(f)); });
  var lAbs   = riskAbsFields.map(function(f)  { return ee.Number(feature.get(f)); });
  var fAbs   = floodAbsFields.map(function(f) { return ee.Number(feature.get(f)); });

  // Census / demographic fields
  var TH     = feature.get('TH');
  var TP     = feature.get('TP');
  var Male   = feature.get('Male');
  var Female = feature.get('Female');
  var HHSize = feature.get('HHSize');
  var TLR    = feature.get('TLR');
  var MLR    = feature.get('MLR');
  var FLR    = feature.get('FLR');

  ee.Dictionary({
    name: name, area: area,
    lPercs: lPercs, fPercs: fPercs,
    lAbs: lAbs,     fAbs: fAbs,
    TH: TH, TP: TP, Male: Male, Female: Female,
    HHSize: HHSize, TLR: TLR, MLR: MLR, FLR: FLR
  }).evaluate(function(d) {

    infoPanel.clear();

    // ── Header ──────────────────────────────────────────────
    infoPanel.add(ui.Label('📍 ' + d.name, {
      fontWeight: 'bold', fontSize: '15px', color: '#00e5ff',
      margin: '0 0 2px 0', backgroundColor: 'rgba(0,0,0,0)'
    }));

    infoPanel.add(ui.Label(
      'Total Area: ' + (d.area / 1e6).toFixed(2) + ' km²',
      { fontSize: '11px', color: '#ffffff', margin: '0 0 8px 0', backgroundColor: 'rgba(0,0,0,0)' }
    ));

    // ── Two-column layout ────────────────────────────────────
    var mainRow = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal'),
      style: { backgroundColor: 'rgba(0,0,0,0)' }
    });

    // ── LEFT column: risk bar charts ─────────────────────────
    var leftCol = ui.Panel({
      style: { width: '225px', backgroundColor: 'rgba(0,0,0,0)' }
    });

    var drawBars = function(title, percs, abs, palette) {

      leftCol.add(ui.Label(title, {
        fontWeight: 'bold', fontSize: '11px', color: '#ffffff',
        margin: '6px 0 4px 0', backgroundColor: 'rgba(0,0,0,0)'
      }));

      for (var i = 0; i < 5; i++) {

        var pct  = (percs[i] !== null && percs[i] !== undefined) ? +percs[i].toFixed(1) : 0;
        var sqkm = (abs[i]   !== null && abs[i]   !== undefined) ? +abs[i].toFixed(2)   : 0;
        var barW = Math.round(pct * 1.8);

        var row = ui.Panel({
          layout: ui.Panel.Layout.flow('horizontal'),
          style: { margin: '1px 0', backgroundColor: 'rgba(0,0,0,0)' }
        });

        row.add(ui.Label(riskLabels[i], {
          fontSize: '9px', color: '#ffffff', width: '60px',
          fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0)'
        }));

        row.add(ui.Label({
          style: {
            backgroundColor: palette[i],
            width: Math.max(barW, 4) + 'px',
            height: '12px',
            margin: '2px 4px 0 0',
            border: '1px solid rgba(255,255,255,0.55)'
          }
        }));

        row.add(ui.Label(pct + '% (' + sqkm + ' km²)', {
          fontSize: '9px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0)'
        }));

        leftCol.add(row);
      }
    };

    drawBars('🏔 LANDSLIDE RISK', d.lPercs, d.lAbs, riskPalette);

    leftCol.add(ui.Label('─────────────────────', {
      fontSize: '9px', color: '#00e5ff', margin: '4px 0', backgroundColor: 'rgba(0,0,0,0)'
    }));

    drawBars('🌊 FLOOD RISK', d.fPercs, d.fAbs, floodPalette);

    // ── RIGHT column: demographics + literacy ────────────────
    var rightCol = ui.Panel({
      style: { width: '195px', backgroundColor: 'rgba(0,0,0,0)', margin: '0 0 0 8px' }
    });

    rightCol.add(ui.Label('👥 Demographics', {
      fontWeight: 'bold', fontSize: '11px', color: '#00e5ff',
      margin: '0 0 4px 0', backgroundColor: 'rgba(0,0,0,0)'
    }));

    var addStat = function(label, val) {
      rightCol.add(ui.Label(label + val, {
        fontSize: '11px', color: '#ffffff',
        margin: '1px 0', backgroundColor: 'rgba(0,0,0,0)'
      }));
    };

    addStat('Population:  ', comma(d.TP));
    addStat('Households:  ', comma(d.TH));
    addStat('Male:        ', comma(d.Male));
    addStat('Female:      ', comma(d.Female));
    addStat('HH Size:     ', d.HHSize !== null ? d.HHSize : 'N/A');

    rightCol.add(ui.Label('─────────────────', {
      fontSize: '9px', color: '#00e5ff', margin: '6px 0 4px 0', backgroundColor: 'rgba(0,0,0,0)'
    }));

    rightCol.add(ui.Label('📚 Literacy Rate (%)', {
      fontWeight: 'bold', fontSize: '11px', color: '#00e5ff',
      margin: '0 0 4px 0', backgroundColor: 'rgba(0,0,0,0)'
    }));

    addStat('Total:   ', d.TLR !== null ? d.TLR : 'N/A');
    addStat('Male:    ', d.MLR !== null ? d.MLR : 'N/A');
    addStat('Female:  ', d.FLR !== null ? d.FLR : 'N/A');

    mainRow.add(leftCol);
    mainRow.add(rightCol);
    infoPanel.add(mainRow);

    infoPanel.add(ui.Label('(Click another Upazila to update)', {
      fontSize: '9px', color: '#dddddd',
      margin: '8px 0 0 0', backgroundColor: 'rgba(0,0,0,0)'
    }));

  });
};


// ============================================================
// 9. CLICK HANDLER
// ============================================================
studyArea.evaluate(function() {

  Map.onClick(function(coords) {

    var pt  = ee.Geometry.Point([coords.lon, coords.lat]);
    var hit = studyArea.filterBounds(pt);

    hit.size().evaluate(function(n) {
      if (n > 0) {
        hit.first().evaluate(function(feat) {
          makeBarChart(ee.Feature(feat));
        });
      }
    });

  });

});


// ============================================================
// 10. SANITY CHECK
// ============================================================
print('Sample feature:', studyArea.first());
print('Feature count:',  studyArea.size());
