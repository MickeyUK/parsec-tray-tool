<script lang="ts">
import { getVersion } from '@tauri-apps/api/app';
import { listen } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/api/process';
import { defineComponent } from 'vue';

import ArcadeTab    from '@/components/tabs/ArcadeTab.vue';
import HostingTab   from '@/components/tabs/HostingTab.vue';
import GuestsTab    from '@/components/tabs/GuestsTab.vue';

import FirebaseService from '@/services/FirebaseService';
import StoreService from '@/services/StoreService';
import EventService from '@/services/EventService';

import User from './models/User';
import HostingService from './services/HostingService';

export default defineComponent({
  name: 'App',
  components: {
    ArcadeTab,
    HostingTab,
    GuestsTab
  },
  data() {
    return {
        tabs: [
            'Arcade',
            'Hosting',
            'Guests',
        ],
        window: true,
        authPage: 0,
        tab: 0,
        isHosting: (HostingService.currentRoom ? true : false),
        hideEvent: null as any,
        hostEvent: null as any,
        tabEvent: null as any,
        version: ''
    };
  },
  methods: {
    setAuthPage(index: number) {
        this.authPage = index;
    },
    forgot(e: Event) {

        e.preventDefault();
        (this.$refs.formRef as HTMLFormElement).classList.add('disabled');
        
        // Convert form data to object
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form) as any;
        const data = Object.fromEntries(formData.entries());

    },
    hideWindow() {
        this.window = false;
    },
    showWindow() {
        this.window = true;
    },
    setTab(index: number) {

        // Set tab index
        this.tab = index;

        // Set tab title
        (this.$refs.tabTitleRef as HTMLElement).innerHTML = this.tabs[index];
        
        // Remove active class from all nav items
        let navItems = document.getElementsByClassName('nav-item');
        for (let i = 0; i < navItems.length; i++) {
            navItems[i].classList.remove('active');
        }

        // Add active class to selected nav item
        navItems[index].classList.add('active');

    },
    async stopHosting() {
        HostingService.stopHosting();
        this.isHosting = false;
    },
    async quit() {
        if (HostingService.currentRoom) {
            await FirebaseService.deleteRoom(HostingService.currentRoom);
            exit(0);
        } else {
            exit(0);
        }
    },
  },
  async mounted() {

    // System tray menu
    listen('tab', (data: any) => {
        StoreService.windowVisible = true;
        const payload = data.payload;
        this.setTab(payload.tab);
    });

    // Tab event
    this.tabEvent = (data: any) => {
        StoreService.windowVisible = true;
        this.setTab(data.tab);
    };
    EventService.on('tab', this.tabEvent);

    // Hide event
    this.hideEvent = () => {
        StoreService.windowVisible = false;
        this.tab = 2;
        this.window = false;
    };
    EventService.on('hide', this.hideEvent);

    // Hosting event
    this.hostEvent = () => {
        this.isHosting = HostingService.currentRoom ? true : false;
    };
    EventService.on('host', this.hostEvent);

    // Set default tab
    this.setTab(2);

    // Set version
    getVersion().then((version) => {
        this.version = version;
    });
    
  },
});
</script>

<template>
    <div id="app">
        <div id="window" v-if="window">
            <div id="window-header">
                <div id="window-title">
                    <h1 ref="tabTitleRef">Arcade</h1>
                </div>
                <div class="nav">
                    <div class="nav-item active" @click="setTab(0)">Arcade</div>
                    <div class="nav-item" @click="setTab(1)">Hosting</div>
                    <div class="nav-item" @click="setTab(2)">Guests</div>
                </div>
            </div>
            <div id="window-content">
                <div class="container">
                    <div id="tabs-container">
                        <ArcadeTab v-if="tab == 0" />
                        <HostingTab v-if="tab == 1" />
                        <GuestsTab v-if="tab == 2" />
                    </div>
                </div>
            </div>
            <div id="window-footer">
                <div class="footer-item">
                    <span class="muted">Version {{ version }}</span>
                </div>
                <div class="footer-item">
                    <div v-if="isHosting" class="btn" @click="stopHosting">
                        Stop Hosting
                    </div>
                    <div class="btn" @click="quit">
                        Quit
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#auth {
    width: 400px;
    padding: 2rem;
    margin: 0 auto;
    box-sizing: border-box;
}

.col > div {
    width: 100%;
}
</style>