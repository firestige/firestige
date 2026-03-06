// ECharts option — 生态位金字塔对照图（等腰三角形）
// 此文件作为 {% echarts %} 外部文件引用，顶层表达式须求值为 option 对象
(function() {
// ─────────────────────────────────────────────
// 粘贴至 https://echarts.apache.org/examples/en/editor.html
// 把最后一行 `const option =` 改为 `option =` 后运行
// 如需调整尺寸，只改下面两行 W / H 即可
// ─────────────────────────────────────────────

const W = 800;   // 与编辑器画布宽度保持一致
const H = 500;   // 与编辑器画布高度保持一致

// ── 由 W/H 推导的布局参数（无需手动调整）─────────────────────
const MARGIN_X = W * 0.05;          // 左右外边距
const ARROW_W  = W * 0.08;          // 中间箭头区宽度
const USABLE_W = W - MARGIN_X * 2 - ARROW_W;
const PYR_W    = USABLE_W * 0.46;   // 单个金字塔底边宽
const TITLE_H  = H * 0.13;          // 标题区高度
const PYR_H    = H - TITLE_H - H * 0.06; // 金字塔高度
const TOP_Y    = TITLE_H;
const LEFT_CX  = MARGIN_X + PYR_W / 2;
const RIGHT_CX = W - MARGIN_X - PYR_W / 2;
const TITLE_Y  = H * 0.04;

// ── 梯形顶点：i=0 顶层（最窄），i=n-1 底层（最宽）────────────
function trapezoid(cx, n, i) {
  const t = i / n, b = (i + 1) / n;
  return [
    [cx - PYR_W * t / 2, TOP_Y + PYR_H * t],
    [cx + PYR_W * t / 2, TOP_Y + PYR_H * t],
    [cx + PYR_W * b / 2, TOP_Y + PYR_H * b],
    [cx - PYR_W * b / 2, TOP_Y + PYR_H * b]
  ];
}

// ── 数据定义 ─────────────────────────────────────────────────
const naturalLayers = [
  { color: '#c0392b', lines: ['🦁 顶级捕食者',       '狮子 · 老鹰 · 虎鲸',   '生物量 <1%'] },
  { color: '#e67e22', lines: ['🐺 基石物种',         '狼 · 海獭 · 蜜蜂',     '移除则系统崩溃'] },
  { color: '#2ecc71', lines: ['🌱 初级消费者+生产者', '草食动物 · 浮游生物',   '总生物量最大'] },
  { color: '#795548', lines: ['🍄 分解者',           '真菌 · 细菌 · 蚯蚓',   '维持物质循环'] }
];

const llmLayers = [
  { color: '#e0451f', lines: ['🦁 旗舰位', 'Opus 4.6 · GPT-5.2',          '调用占比 ~5%'] },
  { color: '#ee7411', lines: ['🐺 主力位', 'DeepSeek V4 · Claude Sonnet', '调用占比 ~35%'] },
  { color: '#2ba193', lines: ['🐜 基座位', '小模型 · 端侧 · 专用微调',     '调用占比 ~60%'] }
];

// ── 构建金字塔 ────────────────────────────────────────────────
function buildPyramid(cx, layers) {
  const n = layers.length;
  const elems = [];

  layers.forEach(({ color, lines }, i) => {
    const pts  = trapezoid(cx, n, i);
    const midY = (pts[0][1] + pts[2][1]) / 2;

    // 该层中点处可用宽度（留 15% 安全边距）
    const availW = PYR_W * ((i + 0.5) / n) * 0.82;
    const layerH = PYR_H / n;

    // 字号与可见行数根据可用空间动态决定
    const fs       = availW < 60 ? 9 : availW < 100 ? 10 : 12;
    const lineH    = fs + 6;
    const maxLines = availW < 50 ? 1 : availW < 95 ? 2 : 3;
    const vis      = lines.slice(0, maxLines);

    // 底部对齐：最后一行的中心落在层底边上方 PAD 处
    const PAD    = 6;
    const botY   = pts[2][1] - PAD;           // 层底边 Y（pts[2] = 右下角）
    const startY = botY - lineH / 2 - (vis.length - 1) * lineH;

    elems.push({
      type: 'polygon',
      shape: { points: pts },
      style: { fill: color, stroke: '#fff', lineWidth: 2 },
      z: 10
    });

    vis.forEach((line, li) => {
      elems.push({
        type: 'text',
        x: cx,
        y: startY + li * lineH,
        style: {
          text: line,
          textAlign: 'center',
          textVerticalAlign: 'middle',
          fill: '#fff',
          fontSize: fs,
          fontWeight: li === 0 ? 'bold' : 'normal',
          textShadowBlur: 2,
          textShadowColor: 'rgba(0,0,0,0.5)'
        },
        z: 20
      });
    });
  });

  return elems;
}

// ── 标题 ──────────────────────────────────────────────────────
function titleElems(cx, text, sub) {
  return [
    {
      type: 'text', x: cx, y: TITLE_Y,
      style: { text, textAlign: 'center', fill: '#2c3e50', fontSize: 16, fontWeight: 'bold' },
      z: 30
    },
    {
      type: 'text', x: cx, y: TITLE_Y + 22,
      style: { text: sub, textAlign: 'center', fill: '#7f8c8d', fontSize: 12 },
      z: 30
    }
  ];
}

return {
  backgroundColor: '#fafafa',
  graphic: {
    elements: [
      ...titleElems(LEFT_CX,  '自然生态营养级', 'Eltonian Pyramid'),
      ...titleElems(RIGHT_CX, 'LLM 市场生态位', 'LLM Ecosystem'),
      {
        type: 'text',
        x: W / 2,
        y: TOP_Y + PYR_H / 2,
        style: { text: '→', textAlign: 'center', textVerticalAlign: 'middle', fill: '#bdc3c7', fontSize: 36 },
        z: 30
      },
      ...buildPyramid(LEFT_CX,  naturalLayers),
      ...buildPyramid(RIGHT_CX, llmLayers)
    ]
  },
  series: []
};
})()

