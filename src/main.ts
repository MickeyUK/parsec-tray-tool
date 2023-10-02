import { createApp } from "vue";
import App from "./App.vue";
import { listen } from "@tauri-apps/api/event";

import StoreService from "@/services/StoreService";
import FirebaseService from "@/services/FirebaseService";
import HostingService from "@/services/HostingService";

// Initialize services
StoreService.init();
HostingService.init();

createApp(App).mount("#app");

// Disable right click
document.addEventListener('contextmenu', (e) => {
    //e.preventDefault();
});

// Disable refresh and F12 and F5
// document.addEventListener('keydown', (e) => {
//     if (e.key === 'F12' || e.key === 'F5') {
//         e.preventDefault();
//     }

//     if (e.ctrlKey && e.key === 'r') {
//         e.preventDefault();
//     }
// });

/*
Listens for application closing and deletes the hosted room if
if wasn't closed by the host.
*/
listen('quit', async () => {

    console.log('Application closing');

});