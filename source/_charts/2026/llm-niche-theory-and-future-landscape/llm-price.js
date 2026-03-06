({
  title: {
    text: 'Intelligence Index vs 价格：最后 20% 能力的指数定价',
    left: 'center',
    textStyle: { color: '#1a1a2e', fontSize: 15 }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>Intelligence: {c}'
  },
  grid: { left: 70, right: 40, bottom: 60, top: 60 },
  xAxis: {
    type: 'value',
    name: 'Intelligence Index',
    nameLocation: 'middle',
    nameGap: 35,
    nameTextStyle: { color: '#1a1a2e', fontSize: 13 },
    min: 40,
    max: 55,
    axisLabel: { color: '#1a1a2e' }
  },
  yAxis: {
    type: 'value',
    name: '混合价（$/百万 token）',
    nameTextStyle: { color: '#1a1a2e', fontSize: 13 },
    max: 12,
    axisLabel: { color: '#1a1a2e' }
  },
  series: [
    {
      type: 'scatter',
      symbolSize: 18,
      data: [
        { value: [42, 0.32], name: 'DeepSeek V3.2', itemStyle: { color: '#2ba193' } },
        { value: [45, 1.35], name: 'Qwen3.5 397B', itemStyle: { color: '#305969' } },
        { value: [47, 1.20], name: 'Kimi K2.5', itemStyle: { color: '#20796f' } },
        { value: [50, 1.55], name: 'GLM-5', itemStyle: { color: '#dea821' } },
        { value: [51, 4.81], name: 'GPT-5.2', itemStyle: { color: '#ee7411' } },
        { value: [53, 10.00], name: 'Opus 4.6', itemStyle: { color: '#872a12' } }
      ],
      label: {
        show: true,
        formatter: '{b}',
        position: 'right',
        color: '#1a1a2e',
        fontSize: 11
      }
    },
    {
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#e63946', width: 2, type: 'dashed' },
      data: [
        [42, 0.32],
        [45, 1.35],
        [47, 1.20],
        [50, 1.55],
        [51, 4.81],
        [53, 10.00]
      ],
      z: 0
    },
    {
      type: 'line',
      symbol: 'none',
      lineStyle: { color: '#aaaaaa', width: 1, type: 'dotted' },
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(224, 69, 31, 0.08)' },
        data: [[{ xAxis: 50 }, { xAxis: 55 }]]
      },
      data: []
    }
  ],
  graphic: [
    {
      type: 'text',
      left: '72%',
      top: '18%',
      style: {
        text: '← 指数起飞区',
        fill: '#e0451f',
        fontSize: 13,
        fontWeight: 'bold'
      }
    },
    {
      type: 'text',
      left: '12%',
      top: '65%',
      style: {
        text: '平坦区 →',
        fill: '#2ba193',
        fontSize: 13,
        fontWeight: 'bold'
      }
    }
  ]
})