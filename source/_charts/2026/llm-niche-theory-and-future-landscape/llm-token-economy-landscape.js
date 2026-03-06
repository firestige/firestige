option = {
  title: {
    text: 'Token 经济型赛道全景：Intelligence Index vs 混合价（2026-03）',
    subtext: '气泡大小 = Output Speed (t/s)  ｜  虚线 = $1/M 门槛',
    left: 'center',
    textStyle: { color: '#1a1a2e', fontSize: 15 },
    subtextStyle: { color: '#666', fontSize: 11 }
  },
  tooltip: {
    trigger: 'item',
    formatter: function (p) {
      var d = p.data;
      return '<b>' + d[3] + '</b><br/>'
        + '厂商：' + d[4] + '<br/>'
        + '混合价：$' + d[0] + '/M<br/>'
        + 'Intelligence Index：' + d[1] + '<br/>'
        + 'Output Speed：' + d[2] + ' t/s';
    }
  },
  grid: { left: 70, right: 30, bottom: 60, top: 80 },
  xAxis: {
    type: 'value',
    name: '混合价（$/百万 token）',
    nameLocation: 'center',
    nameGap: 35,
    nameTextStyle: { color: '#1a1a2e', fontSize: 12 },
    max: 1.3,
    min: 0,
    axisLabel: {
      color: '#1a1a2e',
      formatter: '${value}'
    },
    splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } }
  },
  yAxis: {
    type: 'value',
    name: 'Intelligence Index',
    nameTextStyle: { color: '#1a1a2e', fontSize: 12 },
    min: 20,
    max: 50,
    axisLabel: { color: '#1a1a2e' }
  },
  // $1/M 门槛参考线
  series: [
    // 参考线 $1/M
    {
      type: 'line',
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#e76f51', width: 2 },
        data: [{ xAxis: 1.0 }],
        label: {
          formatter: '$1/M 门槛',
          position: 'end',
          color: '#e76f51',
          fontSize: 11
        }
      },
      data: []
    },
    // 中国厂商
    {
      name: '中国厂商',
      type: 'scatter',
      symbolSize: function (data) {
        return Math.max(8, Math.sqrt(data[2]) * 3.5);
      },
      itemStyle: { color: '#e76f51', opacity: 0.8 },
      // [price, idx, speed, name, vendor]
      data: [
        [0.32, 42, 33,  'DeepSeek V3.2',      'DeepSeek'],
        [0.53, 42, 44,  'MiniMax-M2.5',        'MiniMax'],
        [0.82, 42, 90,  'Qwen3.5 27B',         'Alibaba'],
        [0.15, 41, 154, 'MiMo-V2-Flash',       '小米'],
        [0.69, 37, 128, 'Qwen3.5 35B A3B',     'Alibaba'],
        [0.53, 36, 59,  'KAT-Coder-Pro V1',    '快手'],
        [0.15, 30, 60,  'GLM-4.7-Flash',       '智谱']
      ]
    },
    // 美国厂商
    {
      name: '美国厂商',
      type: 'scatter',
      symbolSize: function (data) {
        return Math.max(8, Math.sqrt(data[2]) * 3.5);
      },
      itemStyle: { color: '#2a9d8f', opacity: 0.8 },
      data: [
        [0.69, 41, 71,  'GPT-5 mini (high)',   'OpenAI'],
        [0.28, 39, 136, 'Grok 4.1 Fast',       'xAI'],
        [0.26, 33, 288, 'gpt-oss-120B',        'OpenAI'],
        [0.38, 33, 768, 'Mercury 2',           'Inception'],
        [0.14, 27, 145, 'GPT-5 nano (high)',   'OpenAI'],
        [0.10, 24, 303, 'gpt-oss-20B',         'OpenAI']
      ]
    },
    // Google
    {
      name: 'Google',
      type: 'scatter',
      symbolSize: function (data) {
        return Math.max(8, Math.sqrt(data[2]) * 3.5);
      },
      itemStyle: { color: '#e9c46a', opacity: 0.8 },
      data: [
        [1.13, 46, 148, 'Gemini 3 Flash',           'Google'],
        [0.56, 34, 382, 'Gemini 3.1 Flash-Lite',    'Google']
      ]
    }
  ],
  legend: {
    data: ['中国厂商', '美国厂商', 'Google'],
    bottom: 5,
    textStyle: { color: '#1a1a2e', fontSize: 11 }
  },
  graphic: [
    {
      type: 'text',
      left: 80,
      top: 75,
      style: {
        text: '右下 = 便宜但弱 ｜ 左上 = 强且便宜（甜区）',
        fill: '#999',
        fontSize: 10
      }
    }
  ]
};
