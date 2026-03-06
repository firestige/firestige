option = {
  title: {
    text: '旗舰模型 API 混合价（$/百万 token，2026-03）',
    left: 'center',
    textStyle: { color: '#1a1a2e', fontSize: 16 }
  },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 60, right: 30, bottom: 40, top: 60 },
  xAxis: {
    type: 'category',
    data: ['DeepSeek V3.2', 'Haiku 4.5', 'GPT-5.2', 'Sonnet 4.6', 'Opus 4.6'],
    axisLabel: { color: '#1a1a2e', fontSize: 12 }
  },
  yAxis: {
    type: 'value',
    name: '美元 / 百万 token',
    nameTextStyle: { color: '#1a1a2e' },
    max: 12,
    axisLabel: { color: '#1a1a2e' }
  },
  series: [
    {
      type: 'bar',
      data: [
        { value: 0.32, itemStyle: { color: '#2ba193' } },
        { value: 2.00, itemStyle: { color: '#dea821' } },
        { value: 4.81, itemStyle: { color: '#ee7411' } },
        { value: 6.00, itemStyle: { color: '#e0451f' } },
        { value: 10.00, itemStyle: { color: '#872a12' } }
      ],
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: '${c}',
        color: '#1a1a2e',
        fontWeight: 'bold',
        fontSize: 13
      }
    }
  ]
};