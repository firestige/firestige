({
  title: {
    text: '上线后 8 周效果趋势',
    left: 'center',
    textStyle: { fontSize: 15, color: '#1f2937' }
  },
  tooltip: { trigger: 'axis' },
  legend: {
    bottom: 8,
    data: ['平均MTTR(分钟)', '一次定位成功率(%)']
  },
  grid: { left: 60, right: 70, top: 60, bottom: 70 },
  xAxis: {
    type: 'category',
    data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']
  },
  yAxis: [
    {
      type: 'value',
      name: 'MTTR(分钟)',
      min: 0,
      max: 30
    },
    {
      type: 'value',
      name: '成功率(%)',
      min: 0,
      max: 100
    }
  ],
  series: [
    {
      name: '平均MTTR(分钟)',
      type: 'line',
      smooth: true,
      data: [18, 12, 9, 7, 6, 5, 4.5, 4.0],
      itemStyle: { color: '#ef4444' },
      areaStyle: { color: 'rgba(239,68,68,0.15)' }
    },
    {
      name: '一次定位成功率(%)',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: [62, 69, 73, 76, 80, 83, 85, 87],
      itemStyle: { color: '#10b981' }
    }
  ]
})