hexo.extend.filter.register('theme_inject', function(injects) {
    injects.footer.raw('default','<div style="display: flex;justify-content: center;height: 20px"><a href="https://beian.miit.gov.cn/" target="_blank">浙ICP备2023020053号-1</a></div>')
})