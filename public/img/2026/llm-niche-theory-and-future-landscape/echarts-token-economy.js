/*
 * Token 经济型模型版图：2025 vs 2026
 * 左：散点图（Intelligence Index vs 混合价），透明色=2025，实色=2026
 * 右：双层环图（内圈=2025，外圈=2026），各价格区间模型数量占比
 *
 * 使用方式：粘贴至 https://echarts.apache.org/examples/en/editor.html
 * 将 const option = 改为 option =
 */

const COLORS = {
  us2025:  'rgba(48,89,105,0.28)',
  cn2025:  'rgba(180,55,24,0.28)',
  eu2025:  'rgba(32,121,111,0.28)',
  us2026:  '#305969',
  cn2026:  '#b43718',
  eu2026:  '#20796f',
};

const BORDER = {
  us2025:  'rgba(48,89,105,0.50)',
  cn2025:  'rgba(180,55,24,0.50)',
  eu2025:  'rgba(32,121,111,0.50)',
};

//  散点数据格式：[Intelligence Index, 混合价($/M), 模型名]
const scatter2025 = {
  us: [
    [35, 0.30, 'GPT-4o mini'],
    [28, 0.38, 'Claude 3 Haiku'],
    [28, 0.12, 'Llama 3.1 70B (API)'],
    [26, 0.30, 'Mistral Small 3'],
    [30, 0.15, 'Gemini 1.5 Flash'],
  ],
  cn: [
    [38, 0.14, 'DeepSeek V3'],
    [35, 0.50, 'Qwen2.5 72B'],
  ],
  eu: [],   // 2025 年 EU/其他尚无典型选手
};

const scatter2026 = {
  us: [
    [46, 1.13, 'Gemini 3 Flash'],
    [41, 0.69, 'GPT-5 mini (high)'],
    [39, 0.28, 'Grok 4.1 Fast'],
    [33, 0.26, 'gpt-oss-120B'],
    [20, 0.30, 'NVIDIA Nemotron Mini'],
    [20, 0.24, 'Amazon Nova Lite'],
    [17, 0.14, 'Olmo 3 7B Think'],
    [16, 0.88, 'R1 Distill Llama 70B'],
    [14, 0.10, 'IBM Granite 4.0 8B'],
    [ 8, 0.03, 'Gemma 3n E4B'],
    [ 7, 0.05, 'Liquid LFM2 24B'],
  ],
  cn: [
    [42, 0.32, 'DeepSeek V3.2'],
    [42, 0.53, 'MiniMax-M2.5'],
    [42, 0.82, 'Qwen3.5 27B'],
    [41, 0.15, 'MiMo-V2-Flash'],
    [37, 0.69, 'Qwen3.5 35B A3B'],
    [36, 0.53, 'KAT-Coder-Pro V1'],
    [30, 0.15, 'GLM-4.7-Flash'],
    [24, 0.12, 'Baidu ERNIE Speed'],
    [22, 0.20, 'ByteDance Seed-Lite'],
  ],
  eu: [
    [33, 0.38, 'Mercury 2 (Inception)'],
    [19, 0.25, 'Mistral Small 3.2'],
  ],
};

// 价格区间分段统计（款数）
function bucketCount(data, ranges) {
  const all = [...data.us, ...data.cn, ...data.eu];
  return ranges.map(([lo, hi]) => all.filter(d => d[1] > lo && d[1] <= hi).length);
}

const ranges = [
  [-0.001, 0.05],   // ≤ $0.05
  [0.05,   0.20],   // $0.05–$0.20
  [0.20,   0.50],   // $0.20–$0.50
  [0.50,   1.00],   // $0.50–$1.00
  [1.00,   9.99],   // > $1.00
];

const bucketLabels = ['≤$0.05', '$0.05–$0.20', '$0.20–$0.50', '$0.50–$1.00', '>$1.00'];
const bucketColors = ['#2ba193','#36c9b8','#dea821','#ee7411','#e0451f'];
const bucketColorsDim = ['rgba(43,161,147,0.38)','rgba(54,201,184,0.38)','rgba(222,168,33,0.38)','rgba(238,116,17,0.38)','rgba(224,69,31,0.38)'];

const cnt2025 = bucketCount(scatter2025, ranges);
const cnt2026 = bucketCount(scatter2026, ranges);

const pie2025 = bucketLabels.map((name, i) => ({
  name,
  value: cnt2025[i],
  itemStyle: { color: bucketColorsDim[i], borderColor: '#fff', borderWidth: 1 },
  label: { show: cnt2025[i] > 0 },
}));

const pie2026 = bucketLabels.map((name, i) => ({
  name,
  value: cnt2026[i],
  itemStyle: { color: bucketColors[i], borderColor: '#fff', borderWidth: 1.5 },
}));

const option = {
  backgroundColor: '#ffffff',
  title: [
    {
      text: 'Token 经济型模型版图  2025 → 2026',
      subtext: '气泡 = 模型；透明色 = 2025；实色 = 2026；颜色区分地区',
      left: '30%',
      textAlign: 'center',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#222' },
      subtextStyle: { fontSize: 11, color: '#666' },
    },
    {
      text: '价格区间分布',
      subtext: '内圈 2025（7 款）  外圈 2026（22 款）',
      left: '78%',
      textAlign: 'center',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#222' },
      subtextStyle: { fontSize: 11, color: '#666' },
    },
  ],
  legend: [
    {
      data: [
        { name: '2025·美国', icon: 'circle', itemStyle: { color: COLORS.us2025, borderColor: BORDER.us2025, borderWidth: 2 } },
        { name: '2025·中国', icon: 'circle', itemStyle: { color: COLORS.cn2025, borderColor: BORDER.cn2025, borderWidth: 2 } },
        { name: '2026·美国', icon: 'circle', itemStyle: { color: COLORS.us2026 } },
        { name: '2026·中国', icon: 'circle', itemStyle: { color: COLORS.cn2026 } },
        { name: '2026·欧洲/其他', icon: 'circle', itemStyle: { color: COLORS.eu2026 } },
      ],
      top: 56,
      left: '1%',
      orient: 'vertical',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 10.5, color: '#444' },
    },
  ],
  tooltip: {
    trigger: 'item',
    formatter: function (params) {
      if (params.seriesType === 'scatter') {
        const [idx, price, name] = params.data;
        return `<b>${name}</b><br/>Intelligence Index: <b>${idx}</b><br/>混合价: <b>$${price}/M</b>`;
      }
      // pie
      return `${params.marker}${params.name}：<b>${params.value} 款</b>（${params.percent}%）`;
    },
  },
  grid: {
    left: '19%',
    right: '46%',
    top: 100,
    bottom: 58,
  },
  xAxis: {
    type: 'value',
    name: 'Intelligence Index',
    nameLocation: 'middle',
    nameGap: 28,
    min: 0,
    max: 55,
    splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
    axisLine: { lineStyle: { color: '#ccc' } },
    axisTick: { lineStyle: { color: '#ccc' } },
    axisLabel: { color: '#555' },
  },
  yAxis: {
    type: 'value',
    name: '混合价（$/M token）',
    nameLocation: 'middle',
    nameGap: 46,
    min: 0,
    max: 1.25,
    splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
    axisLine: { lineStyle: { color: '#ccc' } },
    axisTick: { lineStyle: { color: '#ccc' } },
    axisLabel: { color: '#555', formatter: v => `$${v.toFixed(2)}` },
  },
  series: [
    // ── 2025 散点 ──
    {
      name: '2025·美国',
      type: 'scatter',
      symbolSize: 13,
      itemStyle: { color: COLORS.us2025, borderColor: BORDER.us2025, borderWidth: 1.5 },
      data: scatter2025.us,
    },
    {
      name: '2025·中国',
      type: 'scatter',
      symbolSize: 13,
      itemStyle: { color: COLORS.cn2025, borderColor: BORDER.cn2025, borderWidth: 1.5 },
      data: scatter2025.cn,
    },
    // ── 2026 散点 ──
    {
      name: '2026·美国',
      type: 'scatter',
      symbolSize: 14,
      itemStyle: { color: COLORS.us2026, borderColor: '#2557c7', borderWidth: 1 },
      data: scatter2026.us,
    },
    {
      name: '2026·中国',
      type: 'scatter',
      symbolSize: 14,
      itemStyle: { color: COLORS.cn2026, borderColor: '#a52030', borderWidth: 1 },
      data: scatter2026.cn,
    },
    {
      name: '2026·欧洲/其他',
      type: 'scatter',
      symbolSize: 14,
      itemStyle: { color: COLORS.eu2026, borderColor: '#1a7a36', borderWidth: 1 },
      data: scatter2026.eu,
    },
    // ── 内圈饼：2025 ──
    {
      name: '2025 价格分布',
      type: 'pie',
      center: ['78%', '56%'],
      radius: ['18%', '34%'],
      label: {
        position: 'inside',
        formatter: p => p.value > 0 ? p.value : '',
        fontSize: 11,
        color: '#555',
      },
      labelLine: { show: false },
      emphasis: { scale: false },
      data: pie2025,
    },
    // ── 外圈饼：2026 ──
    {
      name: '2026 价格分布',
      type: 'pie',
      center: ['78%', '56%'],
      radius: ['38%', '56%'],
      label: {
        formatter: p => p.value > 0 ? `${p.name}\n${p.value}款` : '',
        fontSize: 10.5,
        color: '#333',
        lineHeight: 14,
      },
      labelLine: { length: 6, length2: 8 },
      emphasis: {
        label: { fontSize: 12, fontWeight: 'bold' },
      },
      data: pie2026,
    },
  ],
};
