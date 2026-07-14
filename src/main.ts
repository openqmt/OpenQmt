import { createApp } from "vue";
import { createPinia } from "pinia";
import naive from "naive-ui";
import router from "./router";
import App from "./App.vue";
import "./styles/global.css";
import { configure } from "vue-gtag"

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(naive);
configure({
  tagId: import.meta.env.VITE_GTAG_ID || ''
})
app.mount("#app");
