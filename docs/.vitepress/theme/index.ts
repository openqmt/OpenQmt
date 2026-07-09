import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import DownloadPage from './components/DownloadPage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('DownloadPage', DownloadPage as any)
  },
}
