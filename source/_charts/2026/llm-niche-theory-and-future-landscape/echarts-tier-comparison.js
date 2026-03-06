({
  backgroundColor: '#fff',
  title: {
    text: '三层生态位：模型数量 / 调用量 / 总花费',
    subtext: '各维度在旗舰位 / 主力位 / 基座位的占比（%）',
    left: 'center',
    top: 16,
    textStyle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e' },
    subtextStyle: { fontSize: 12, color: '#666' }
  },
  legend: {
    bottom: 12,
    itemWidth: 14,
    itemHeight: 14,
    textStyle: { fontSize: 13 },
    data: ['模型数量', '调用量', '总花费']
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) =>
      params[0].name + '<br>' +
      params.map(p => `${p.marker}${p.seriesName}：<b>${p.value}%</b>`).join('<br>')
  },
  grid: { left: 60, right: 40, top: 90, bottom: 60 },
  xAxis: {
    type: 'category',
    data: ['Apex 旗舰位', 'Keystone 主力位', 'Decomposer 基座位'],
    axisLabel: { fontSize: 13, fontWeight: 'bold' },
    axisTick: { alignWithLabel: true }
  },
  yAxis: {
    type: 'value',
    name: '占比 (%)',
    nameTextStyle: { fontSize: 12, color: '#888' },
    max: 100,
    splitLine: { lineStyle: { type: 'dashed', color: '#e8e8e8' } }
  },
  series: [
    {
      name: '模型数量',
      type: 'bar',
      barMaxWidth: 40,
      data: [5, 15, 80],
      // 炭蓝：数量呈金字塔，基座压倒性最多
      itemStyle: { color: '#5094af', borderRadius: [3, 3, 0, 0] },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
        fontSize: 12,
        color: '#5094af',
        fontWeight: 'bold'
      }
    },
    {
      name: '调用量',
      type: 'bar',
      barMaxWidth: 40,
      data: [5, 35, 60],
      // 碧绿：调用量也呈金字塔，与数量同向
      itemStyle: { color: '#36c9b8', borderRadius: [3, 3, 0, 0] },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
        fontSize: 12,
        color: '#36c9b8',
        fontWeight: 'bold'
      }
    },
    {
      name: '总花费',
      type: 'bar',
      barMaxWidth: 40,
      data: [25, 55, 20],
      // 托斯卡纳金：花费呈菱形，主力位独吞大头——最反直觉的一条
      itemStyle: { color: '#dea821', borderRadius: [3, 3, 0, 0] },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
        fontSize: 12,
        color: '#dea821',
        fontWeight: 'bold'
      }
    }
  ],
  // 用 markLine 在「总花费」系列上标注菱形的拐点，强化视觉对比
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: 60,
      style: {
        text: '↳ 花费（金色）呈菱形：主力层独吞55%，而非随数量/调用量同向的金字塔',
        fontSize: 11,
        fill: '#dea821',
        fontStyle: 'italic'
      }
    }
  ]
})
