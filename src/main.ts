import { createApp } from "vue";
import "./styles.css";
import App from "./App.vue";
import StoreService from "./services/StoreService";

StoreService.init();

createApp(App).mount("#app");
