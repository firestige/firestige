/**
 * Hexo Tag Plugin: {% echarts [height] [width] [filepath] %}...option...{% endecharts %}
 *
 * 内联模式（option 写在 tag 内）：
 *   {% echarts 400px %}
 *   { xAxis: ..., yAxis: ..., series: [...] }
 *   {% endecharts %}
 *
 * 外部文件模式（content 为空时，最后一个参数视为文件路径，相对于站点根目录）：
 *   {% echarts 500px charts/2026/my-post/chart.js %}{% endecharts %}
 *
 *   {% echarts 500px 80% charts/2026/my-post/chart.js %}{% endecharts %}
 */

const fs   = require('fs');
const path = require('path');

const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';

hexo.extend.tag.register('echarts', function (args, content) {
  // 外部文件模式：content 为空，最后一个 arg 是路径
  if (!content.trim() && args.length >= 1) {
    const filePath = path.resolve(hexo.base_dir, args[args.length - 1]);
    try {
      content = fs.readFileSync(filePath, 'utf8');
      args = args.slice(0, args.length - 1);
    } catch (e) {
      return `<p style="color:red">[echarts] 无法读取文件：${args[args.length - 1]}</p>`;
    }
  }

  const height = args[0] || '400px';
  const width  = args[1] || '100%';
  const id     = 'echarts-' + Math.random().toString(36).slice(2, 11);

  return `
<div id="${id}" style="width:${width};height:${height};margin:1em 0;"></div>
<script>
(function () {
  function init() {
    var dom = document.getElementById('${id}');
    if (!dom) return;
    var chart = echarts.init(dom);
    chart.setOption(${content.trim()});
    window.addEventListener('resize', function () { chart.resize(); });
  }
  if (typeof echarts !== 'undefined') {
    init();
  } else if (window.__echartsLoading) {
    window.__echartsQueue = window.__echartsQueue || [];
    window.__echartsQueue.push(init);
  } else {
    window.__echartsLoading = true;
    window.__echartsQueue = window.__echartsQueue || [];
    window.__echartsQueue.push(init);
    var s = document.createElement('script');
    s.src = '${ECHARTS_CDN}';
    s.onload = function () {
      window.__echartsLoading = false;
      (window.__echartsQueue || []).forEach(function (fn) { fn(); });
      window.__echartsQueue = [];
    };
    document.head.appendChild(s);
  }
})();
</script>`.trim();
}, { ends: true });
