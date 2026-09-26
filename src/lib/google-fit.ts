export async function pullGoogleFitData(providerToken: string) {
  // Use a timezone-aware calculation for the start of the day (India Standard Time UTC+5:30)
  // This matches the user's Google Fit app exactly.
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const dateObj: any = {};
  parts.forEach(p => dateObj[p.type] = p.value);
  const midnightStr = `${dateObj.year}-${dateObj.month}-${dateObj.day}T00:00:00+05:30`;
  
  const startTimeMillis = new Date(midnightStr).getTime();
  // Google Fit bucketByTime: { durationMillis: 86400000 } requires the window to be exactly 24 hours long 
  // or else it might drop the bucket entirely if it's incomplete!
  const endTimeMillis = startTimeMillis + 86400000;

  try {
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { 
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' 
          },
          { dataTypeName: 'com.google.calories.expended' }
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to fetch from Google Fit:', errText);
      return { steps: 0, calories: 0, rawDebug: 'Failed: ' + response.status + ' ' + errText };
    }

    const data = await response.json();
    console.log("Google Fit Data:", JSON.stringify(data, null, 2));

    let steps = 0;
    let calories = 0;

    if (data.bucket) {
      data.bucket.forEach((bucket: any) => {
        if (bucket.dataset) {
          bucket.dataset.forEach((ds: any) => {
            if (ds.dataSourceId.includes('step_count')) {
              ds.point?.forEach((p: any) => {
                steps += p.value?.[0]?.intVal || 0;
              });
            } else if (ds.dataSourceId.includes('calories')) {
              ds.point?.forEach((p: any) => {
                calories += p.value?.[0]?.fpVal || 0;
              });
            }
          });
        }
      });
    }

    calories = Math.round(calories);

    return { steps, calories, rawDebug: 'Success JSON: ' + JSON.stringify(data) };
  } catch (err: any) {
    return { steps: 0, calories: 0, rawDebug: 'Exception: ' + err?.message };
  }
}

export async function pushGoogleFitWeight(providerToken: string, weightKg: number) {
  const now = Date.now() * 1000000; // nanoseconds
  try {
    // 1. We must ensure a DataSource exists for our app, but for simplicity, we can use a raw source or create one.
    // The easiest way is to push to a custom Data Source created by our app.
    // Let's create the data source first (it's idempotent).
    const dataSourceId = "raw:com.google.weight:app.vercel.health-tracker:weight";
    
    await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${providerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "dataStreamName": "weight",
        "type": "raw",
        "application": { "name": "Health Tracker Vercel" },
        "dataType": { "name": "com.google.weight", "field": [{ "name": "weight", "format": "floatPoint" }] },
        "device": { "manufacturer": "Health Tracker", "model": "Vercel", "type": "unknown", "uid": "1000001", "version": "1.0" }
      })
    }); // ignore errors if it already exists

    // 2. Push data point
    const datasetId = `${now}-${now}`;
    await fetch(`https://www.googleapis.com/fitness/v1/users/me/dataSources/${dataSourceId}/datasets/${datasetId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${providerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minStartTimeNs: now,
        maxEndTimeNs: now,
        dataSourceId: dataSourceId,
        point: [{
          startTimeNanos: now,
          endTimeNanos: now,
          dataTypeName: "com.google.weight",
          value: [{ fpVal: weightKg }]
        }]
      })
    });
    
  } catch (err) {
    console.error('Failed to push weight', err);
  }
}

export async function pullGoogleFitBodyMetrics(providerToken: string) {
  const endTimeMillis = Date.now();
  const startTimeMillis = endTimeMillis - (30 * 24 * 60 * 60 * 1000); // Look back 30 days for latest weight

  try {
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: 'com.google.weight.summary' },
          { dataTypeName: 'com.google.height.summary' }
        ],
        bucketByTime: { durationMillis: (30 * 24 * 60 * 60 * 1000) },
        startTimeMillis,
        endTimeMillis
      }),
    });

    if (!response.ok) {
      console.error('Failed to pull body metrics:', await response.text());
      return { weight: null, height: null };
    }

    const data = await response.json();
    let weight = null;
    let height = null;

    if (data.bucket && data.bucket.length > 0) {
      const bucket = data.bucket[0]; // We aggregated into 1 big 30-day bucket
      if (bucket.dataset) {
        bucket.dataset.forEach((ds: any) => {
          if (ds.dataSourceId.includes('weight')) {
            // It's a summary: usually [average, max, min]. We'll take average or just the first point.
            ds.point?.forEach((p: any) => {
              if (p.value?.[0]?.fpVal) weight = p.value[0].fpVal;
            });
          } else if (ds.dataSourceId.includes('height')) {
            ds.point?.forEach((p: any) => {
              if (p.value?.[0]?.fpVal) height = p.value[0].fpVal * 100; // convert meters to cm
            });
          }
        });
      }
    }

    // Google Fit returns height in meters usually, weight in kg
    if (weight) weight = Math.round(weight * 10) / 10;
    if (height) height = Math.round(height);

    return { weight, height };
  } catch (err) {
    console.error('Error pulling body metrics:', err);
    return { weight: null, height: null };
  }
}
