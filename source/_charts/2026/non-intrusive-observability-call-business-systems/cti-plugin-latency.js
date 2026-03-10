({
  title: {
    text: '插件增强前后 CTI 延迟分位对比',
    left: 'center',
    textStyle: { fontSize: 15, color: '#1f2937' }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    bottom: 8,
    data: ['增强前', '增强后']
  },
  grid: { left: 60, right: 30, top: 60, bottom: 60 },
  xAxis: {
    type: 'category',
    data: ['P50', 'P95', 'P99']
  },
  yAxis: {
    type: 'value',
    name: '处理延迟(ms)'
  },
  series: [
    {
      name: '增强前',
      type: 'bar',
      data: [11, 28, 42],
      barMaxWidth: 32,
      itemStyle: { color: '#60a5fa' }
    },
    {
      name: '增强后',
      type: 'bar',
      data: [13, 31, 46],
      barMaxWidth: 32,
      itemStyle: { color: '#1d4ed8' },
      label: {
        show: true,
        position: 'top',
        formatter: function (p) {
          var base = [11, 28, 42][p.dataIndex];
          var ratio = ((p.value - base) / base) * 100;
          return '+' + ratio.toFixed(1) + '%';
        }
      }
    }
  ]
})