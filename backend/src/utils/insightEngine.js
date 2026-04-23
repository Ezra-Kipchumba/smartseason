const cropProfiles = {
  Maize:        { optimalTemp: [18, 30], humidity: [40, 70] },
  Beans:        { optimalTemp: [16, 27], humidity: [50, 75] },
  Wheat:        { optimalTemp: [15, 25], humidity: [40, 65] },
  Sorghum:      { optimalTemp: [20, 35], humidity: [30, 60] },
  Tomatoes:     { optimalTemp: [18, 28], humidity: [50, 70] },
  Potatoes:     { optimalTemp: [15, 22], humidity: [60, 80] },
  Onions:       { optimalTemp: [13, 24], humidity: [50, 70] },
  Coffee:       { optimalTemp: [18, 24], humidity: [60, 80] },
  Tea:          { optimalTemp: [18, 30], humidity: [70, 90] },
  Bananas:      { optimalTemp: [26, 30], humidity: [75, 90] },
  Mangoes:      { optimalTemp: [24, 30], humidity: [50, 70] },
  Avocados:     { optimalTemp: [16, 28], humidity: [60, 80] },
  Cabbage:      { optimalTemp: [15, 20], humidity: [60, 80] },
  Carrots:      { optimalTemp: [16, 21], humidity: [60, 70] },
  Pineapples:   { optimalTemp: [22, 32], humidity: [60, 80] },
  Sugarcane:    { optimalTemp: [20, 35], humidity: [60, 80] },
  Sunflower:    { optimalTemp: [20, 30], humidity: [40, 60] },
  SweetPotatoes:{ optimalTemp: [20, 30], humidity: [50, 70] },
  Citrus:       { optimalTemp: [20, 30], humidity: [50, 70] },
  Flowers:      { optimalTemp: [18, 28], humidity: [50, 70] },
  Sisal:        { optimalTemp: [20, 30], humidity: [40, 60] }
};

function generateInsights(field, weather) {
  const insights = [];

  if (!weather) return insights;

  const crop = field.crop_type;
  const stage = field.stage;
  const irrigation = field.irrigation_type;
  const soil = field.soil_type;

  const { temp, humidity } = weather;

  const profile = cropProfiles[crop] || { temp: [18, 30], humidity: [40, 70] };

  const [minTemp, maxTemp] = profile.temp;
  const [minHum, maxHum] = profile.humidity;

  // ─────────────────────────────────────
  // 🌡 TEMPERATURE LOGIC
  // ─────────────────────────────────────
  if (temp > maxTemp) {
    insights.push({
      type: 'warning',
      message: `High temperature (${temp}°C) for ${crop}.`,
      action: irrigation === 'Rain-fed'
        ? 'High stress risk — consider irrigation urgently.'
        : 'Monitor irrigation to prevent heat stress.'
    });
  } else if (temp < minTemp) {
    insights.push({
      type: 'info',
      message: `Low temperature (${temp}°C).`,
      action: 'Growth may slow — monitor closely.'
    });
  }

  // ─────────────────────────────────────
  // 💧 HUMIDITY + IRRIGATION
  // ─────────────────────────────────────
  if (humidity < minHum) {
    if (irrigation === 'Rain-fed') {
      insights.push({
        type: 'risk',
        message: 'Low humidity + no irrigation.',
        action: 'High drought risk — crop stress likely.'
      });
    } else {
      insights.push({
        type: 'warning',
        message: 'Low humidity detected.',
        action: 'Increase irrigation frequency.'
      });
    }
  }

  if (humidity > maxHum) {
    insights.push({
      type: 'risk',
      message: 'High humidity — fungal risk.',
      action: 'Inspect crops and apply fungicide if needed.'
    });
  }

  // ─────────────────────────────────────
  // 🌱 SOIL INTELLIGENCE
  // ─────────────────────────────────────
  if (soil === 'Sandy' && humidity < 50) {
    insights.push({
      type: 'risk',
      message: 'Sandy soil loses moisture quickly.',
      action: 'Frequent irrigation required.'
    });
  }

  if (soil === 'Clay' && humidity > 70) {
    insights.push({
      type: 'warning',
      message: 'Clay soil retains too much water.',
      action: 'Risk of waterlogging — improve drainage.'
    });
  }

  if (soil === 'Loamy') {
    insights.push({
      type: 'good',
      message: 'Loamy soil supports balanced growth.',
      action: 'Conditions are favorable.'
    });
  }

  // ─────────────────────────────────────
  // 🌿 STAGE-BASED INTELLIGENCE
  // ─────────────────────────────────────
  if (stage === 'planted') {
    insights.push({
      type: 'info',
      message: 'Germination phase.',
      action: 'Ensure adequate soil moisture.'
    });
  }

  if (stage === 'growing') {
    insights.push({
      type: 'info',
      message: 'Active growth stage.',
      action: 'Monitor nutrients and pests.'
    });
  }

  if (stage === 'ready') {
    insights.push({
      type: 'info',
      message: 'Crop nearing harvest.',
      action: 'Prepare harvesting logistics.'
    });
  }

  // ─────────────────────────────────────
  // ✅ GUARANTEE OUTPUT
  // ─────────────────────────────────────
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      message: 'Conditions are stable.',
      action: 'Continue monitoring.'
    });
  }

  return insights;
}

module.exports = { generateInsights };