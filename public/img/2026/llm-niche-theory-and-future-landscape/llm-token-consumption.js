option = {
  title: {
    text: '三种使用模式的 Token 消耗量级',
    left: 'center',
    textStyle: { color: '#1a1a2e', fontSize: 16 }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: function (params) {
      var d = params[0];
      return d.name + '<br/>≈ ' + d.value.toLocaleString() + ' token';
    }
  },
  grid: { left: 80, right: 30, bottom: 50, top: 60 },
  xAxis: {
    type: 'category',
    data: ['普通聊天', 'RAG 问答', 'Agent 编码'],
    axisLabel: { color: '#1a1a2e', fontSize: 13 }
  },
  yAxis: {
    type: 'log',
    name: 'Token 消耗（对数刻度）',
    nameTextStyle: { color: '#1a1a2e', fontSize: 12 },
    min: 500,
    max: 2000000,
    axisLabel: {
      color: '#1a1a2e',
      formatter: function (val) {
        if (val >= 1000000) return (val / 1000000) + 'M';
        if (val >= 1000) return (val / 1000) + 'K';
        return val;
      }
    }
  },
  series: [
    {
      type: 'bar',
      data: [
        { value: 1000, itemStyle: { color: '#2a9d8f' } },
        { value: 8000, itemStyle: { color: '#e9c46a' } },
        { value: 500000, itemStyle: { color: '#e76f51' } }
      ],
      barWidth: '45%',
      label: {
        show: true,
        position: 'top',
        color: '#1a1a2e',
        fontWeight: 'bold',
        fontSize: 13,
        formatter: function (params) {
          var v = params.value;
          if (v >= 1000000) return '~' + (v / 1000000) + 'M';
          if (v >= 1000) return '~' + (v / 1000) + 'K';
          return '~' + v;
        }
      }
    }
  ],
  graphic: [
    {
      type: 'text',
      left: 'center',
      bottom: 5,
      style: {
        text: 'Agent 的单次消耗是普通聊天的 500 倍',
        fill: '#e76f51',
        fontSize: 12,
        fontWeight: 'bold'
      }
    }
  ]
};
