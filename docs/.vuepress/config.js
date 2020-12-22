module.exports = {
  // 页面标题
  title: '中间件组',
  // 网页描述
  description: '分享',
  head: [
    // 页面icon
    ['link', { rel: 'icon', href: '/icon.png' }]
  ],
  // 端口号
  port: 3000,
  // 仓库地址
  repo: 'https://github.com/middlewarefe/middlewarefe.github.io.git',
  markdown: {
    // 代码块行号
    lineNumbers: true
  },
  themeConfig: {
    // 最后更新时间
    lastUpdated: '最后更新时间',
    // 所有页面自动生成侧边栏
    sidebar: 'auto',
    // 仓库地址
    repo: 'https://github.com/middlewarefe/middlewarefe.github.io.git',
    base: '/',
    // 仓库链接label
    repoLabel: 'Github',
    // // 编辑链接
    editLinks: true,
    // 编辑链接label
    editLinkText: '编辑此页',
    // 导航
    nav: [
      { text: 'JavaScript', link: '/JavaScript/'},
      { text: 'CSS', link: '/css/test/'},
      { text: 'Node.js',link: '/node/'},
      { text: 'Vue',link: '/vue/'},
      { text: '每日分享',link: '/share/'},
      { text: '心得', link: '/algorithm/'},
      { text: 'JavaScript书籍', items: [
          { text: '你不知道的JavaScript(上)', link: '/books/你不知道的javascript上'},
          { text: '你不知道的JavaScript(中)', link: '/books/你不知道的javascript中'},
          { text: '你不知道的JavaScript(下)', link: '/books/你不知道的javascript下'}
        ]},
      { text: '基础配置功能',link: '/common/'},
  ]},
  configureWebpack: {
    resolve: {
      // 静态资源的别名
      alias: {
        '@vuepress': '../images/vuepress',
        '@vue': '../images/vue'
      }
    }
  }
}