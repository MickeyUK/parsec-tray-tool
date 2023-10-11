import { createApp } from "vue";
import "./styles.css";
import App from "./App.vue";
import StoreService from "./services/StoreService";
import HostingService from "./services/HostingService";

StoreService.init();
HostingService.init();

createApp(App).mount("#app");
