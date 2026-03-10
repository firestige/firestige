({
  title: {
    text: 'Trace 归并与兜底检索稳定性',
    left: 'center',
    textStyle: { fontSize: 15, color: '#1f2937' }
  },
  tooltip: { trigger: 'axis' },
  legend: {
    bottom: 8,
    data: ['自动归并成功率', 'Tag兜底占比', '需人工归并工单数']
  },
  grid: { left: 60, right: 70, top: 60, bottom: 70 },
  xAxis: {
    type: 'category',
    data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']
  },
  yAxis: [
    {
      type: 'value',
      name: '比例(%)',
      min: 0,
      max: 100
    },
    {
      type: 'value',
      name: '工单数',
      min: 0,
      max: 30
    }
  ],
  series: [
    {
      name: '自动归并成功率',
      type: 'line',
      smooth: true,
      data: [88, 90, 91, 93, 94, 95, 96, 96],
      itemStyle: { color: '#2563eb' },
      areaStyle: { color: 'rgba(37,99,235,0.15)' }
    },
    {
      name: 'Tag兜底占比',
      type: 'line',
      smooth: true,
      data: [10, 8, 7, 6, 5, 4, 3, 3],
      itemStyle: { color: '#f59e0b' }
    },
    {
      name: '需人工归并工单数',
      type: 'bar',
      yAxisIndex: 1,
      data: [24, 19, 16, 13, 10, 8, 6, 5],
      barMaxWidth: 26,
      itemStyle: { color: '#ef4444' }
    }
  ]
})