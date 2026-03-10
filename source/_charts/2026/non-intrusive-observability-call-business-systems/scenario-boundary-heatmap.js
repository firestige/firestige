({
  title: {
    text: '典型场景适配热力图',
    subtext: '3=高可用, 2=可用但需关注, 1=需人工介入',
    left: 'center',
    textStyle: { fontSize: 15, color: '#1f2937' }
  },
  tooltip: {
    position: 'top',
    formatter: function (p) {
      var xLabels = ['自动归并', 'Tag检索', '人工排障成本'];
      var yLabels = ['普通呼叫', '转接', '会议', '盲转', '超长通话'];
      var level = ['需人工介入', '可用但需关注', '高可用'][p.data[2] - 1];
      return p.marker + yLabels[p.data[1]] + ' / ' + xLabels[p.data[0]] + '<br/>' + level;
    }
  },
  grid: { height: '58%', top: 72 },
  xAxis: {
    type: 'category',
    data: ['自动归并', 'Tag检索', '人工排障成本'],
    splitArea: { show: true }
  },
  yAxis: {
    type: 'category',
    data: ['普通呼叫', '转接', '会议', '盲转', '超长通话'],
    splitArea: { show: true }
  },
  visualMap: {
    min: 1,
    max: 3,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: 8,
    inRange: {
      color: ['#ef4444', '#f59e0b', '#22c55e']
    }
  },
  series: [
    {
      name: '适配度',
      type: 'heatmap',
      data: [
        [0, 0, 3],
        [1, 0, 3],
        [2, 0, 2],

        [0, 1, 2],
        [1, 1, 3],
        [2, 1, 2],

        [0, 2, 2],
        [1, 2, 2],
        [2, 2, 1],

        [0, 3, 2],
        [1, 3, 2],
        [2, 3, 1],

        [0, 4, 1],
        [1, 4, 2],
        [2, 4, 1]
      ],
      label: {
        show: true,
        formatter: function (p) {
          return ['低', '中', '高'][p.data[2] - 1];
        }
      }
    }
  ]
})