export async function pullGoogleFitData(providerToken: string) {
  // Aggregate steps and calories
  const startTimeMillis = new Date().setHours(0, 0, 0, 0);
  const endTimeMillis = new Date().setHours(23, 59, 59, 999);

  try {
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: 'com.google.step_count.delta', dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' },
          { dataTypeName: 'com.google.calories.expended' }
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
      }),
    });

    if (!response.ok) {
      console.error('Failed to fetch from Google Fit:', await response.text());
      return { steps: 0, calories: 0 };
    }

    const data = await response.json();
    let steps = 0;
    let calories = 0;

    const bucket = data.bucket?.[0];
    if (bucket && bucket.dataset) {
      bucket.dataset.forEach((ds: any) => {
        if (ds.dataSourceId.includes('step_count')) {
          steps = ds.point?.[0]?.value?.[0]?.intVal || 0;
        } else if (ds.dataSourceId.includes('calories')) {
          calories = Math.round(ds.point?.[0]?.value?.[0]?.fpVal || 0);
        }
      });
    }

    return { steps, calories };
  } catch (err) {
    console.error('Error in Google Fit sync:', err);
    return { steps: 0, calories: 0 };
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
