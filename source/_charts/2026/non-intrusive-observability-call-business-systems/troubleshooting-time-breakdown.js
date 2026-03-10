({
  title: {
    text: '跨系统排障耗时构成对比',
    left: 'center',
    textStyle: { fontSize: 15, color: '#1f2937' }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    bottom: 8,
    data: ['线索定位', '跨系统切换', '时间线比对', '根因确认']
  },
  grid: { left: 60, right: 30, top: 60, bottom: 70 },
  xAxis: {
    type: 'category',
    data: ['上线前', '上线后']
  },
  yAxis: {
    type: 'value',
    name: '分钟'
  },
  series: [
    {
      name: '线索定位',
      type: 'bar',
      stack: 'total',
      data: [10, 1.5],
      itemStyle: { color: '#3b82f6' }
    },
    {
      name: '跨系统切换',
      type: 'bar',
      stack: 'total',
      data: [7, 0.6],
      itemStyle: { color: '#f59e0b' }
    },
    {
      name: '时间线比对',
      type: 'bar',
      stack: 'total',
      data: [11, 1.0],
      itemStyle: { color: '#ef4444' }
    },
    {
      name: '根因确认',
      type: 'bar',
      stack: 'total',
      data: [5, 3],
      label: {
        show: true,
        position: 'top',
        formatter: function (p) {
          return p.dataIndex === 0 ? '总计 33 分钟' : '总计 6.1 分钟';
        }
      },
      itemStyle: { color: '#10b981' }
    }
  ]
})