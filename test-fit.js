const data = {
  "bucket": [
    {
      "startTimeMillis": "1700000000000",
      "endTimeMillis": "1700086400000",
      "dataset": [
        {
          "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:aggregated",
          "point": [
            {
              "value": [
                {
                  "intVal": 750
                }
              ]
            }
          ]
        },
        {
          "dataSourceId": "derived:com.google.calories.expended:com.google.android.gms:aggregated",
          "point": [
            {
              "value": [
                {
                  "fpVal": 1200.5
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

let steps = 0;
let calories = 0;
const bucket = data.bucket?.[0];
if (bucket && bucket.dataset) {
  bucket.dataset.forEach((ds) => {
    if (ds.dataSourceId.includes('step_count')) {
      steps = ds.point?.[0]?.value?.[0]?.intVal || 0;
    } else if (ds.dataSourceId.includes('calories')) {
      calories = Math.round(ds.point?.[0]?.value?.[0]?.fpVal || 0);
    }
  });
}
console.log('Parsed:', { steps, calories });
