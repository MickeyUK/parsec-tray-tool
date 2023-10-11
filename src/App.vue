<script lang="ts">
import { open } from '@tauri-apps/api/shell';
import { getVersion, show } from '@tauri-apps/api/app';
import { listen } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/api/process';
import { defineComponent } from 'vue';

import StoreService from '@/services/StoreService';
import EventService from '@/services/EventService';

import Settings from '@/components/Settings.vue';

import User from './models/User';
import GuestStatus from './models/GuestStatus';

export default defineComponent({
  name: 'App',
  components: {
    Settings,
  },
  data() {
    return {
        showArcadeTab: true,
        showChatTab: false,
        showHostingTab: true,
        showSettingsTab: true,
        showHelpTab: true,
        version: '',
        url: 'https://mickeyuk.com/arcade?ptt=1',
        roomId: '',
        roomToken: StoreService.config.roomToken,
        isHosting: false,
        showSettings: false,
        refreshInterval: null as any,
        currentGuests: [] as User[],
        maxGuests: 0,
    };
  },
  methods: {
    openExternal(url: string) {
        open(url);
    },
    async stopHosting() {

        // Ajax call to stop hosting
        const response = await fetch('https://mickeyuk.com/api/arcade/room/close', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room_token: this.roomToken,
            }),
        });

        // Get response
        const data = await response.json();

        // If 200 then close room
        if (data.status === 200) {
            this.isHosting = false;
        }

        // Clear refresh interval
        if (this.refreshInterval)
            clearInterval(this.refreshInterval);

        // Refresh iframe
        this.setArcadeTab();

        // Disable chat
        this.disableChat();

    },
    async refreshRoom() {

        // Ajax call to keep room awake
        const response = await fetch('https://mickeyuk.com/api/arcade/room/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room_token: this.roomToken,
            }),
        });

        // Get response
        const data = await response.json();

    },
    async quit() {
      exit(0);
    },
    setArcadeTab() {
        this.setNavPill('arcade');
        this.url = 'https://mickeyuk.com/arcade?ptt=1';
        this.showIframe();
    },
    setChatTab() {
        this.setNavPill('chat');
        this.showIframe();
    },
    setHostingTab() {
        this.roomToken = StoreService.config.roomToken;
        this.setNavPill('hosting');
        this.url = 'https://mickeyuk.com/arcade/hosting?ptt=1&room_token=' + this.roomToken;
        this.showIframe();
    },
    setSettingsTab() {
        this.setNavPill('settings');
        this.showWindow();
        this.showSettings = true;
    },
    setNavPill(id: string) {
        // @ts-ignore
        $('.nav .nav-item').removeClass('active');
        
        const navItem = document.querySelector('#nav-' + id);
        if (navItem) {
            navItem.classList.add('active');
        }
    },
    toggleNav() {
        let nav = document.getElementsByClassName('nav')[0];
        if (nav.classList.contains('active')) {
            nav.classList.remove('active');
        } else {
            nav.classList.add('active');
        }
    },
    showIframe() {
        (this.$refs.iframeRef as HTMLIFrameElement).style.display = 'block';
        (this.$refs.windowRef as HTMLElement).style.display = 'none';
        this.showSettings = false;
    },
    showWindow() {
        (this.$refs.iframeRef as HTMLIFrameElement).style.display = 'none';
        (this.$refs.windowRef as HTMLElement).style.display = 'block';
    },
    enableChat() {
        this.showArcadeTab = false;
        this.showHostingTab = false;
        this.showChatTab = true;
        setTimeout(() => {
            this.setChatTab();
        }, 0);
    },
    disableChat() {
        this.showArcadeTab = true;
        this.showHostingTab = true;
        this.showChatTab = false;
        setTimeout(() => {
            this.setArcadeTab();
        }, 0);
    },
  },
  async mounted() {

    // System tray menu
    listen('tab', (data: any) => {
        const payload = data.payload;
        
    });

    // On quit
    listen('quit', async () => {
        
        // Close room if hosting
        if (this.isHosting) {
            await this.stopHosting();
        }

        this.quit();
    });

    // Set version
    getVersion().then((version) => {
        this.version = version;
    });

    // Listen for message from iframe src
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch(message.type) {
            case 'isHosting':
                if (message.value == true && !this.isHosting) {
                    // Refresh room every 55 minutes
                    this.refreshInterval = setInterval(() => {
                        this.refreshRoom();
                    }, 3300000);
                }
                this.isHosting = message.value;
            break;
            case 'enableChat':
                this.roomId = message.roomId;
                this.enableChat();
            break;
        }
    });
    
  },
});
</script>

<template>
    <div id="app">
        <div id="window">
            <div id="window-header">
                <div id="window-title">
                    <h1 ref="tabTitleRef">Arcade</h1>
                </div>
                <div class="nav-toggle" @click="toggleNav">
                  <svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22 16.75c0-.414-.336-.75-.75-.75h-18.5c-.414 0-.75.336-.75.75s.336.75.75.75h18.5c.414 0 .75-.336.75-.75zm0-5c0-.414-.336-.75-.75-.75h-18.5c-.414 0-.75.336-.75.75s.336.75.75.75h18.5c.414 0 .75-.336.75-.75zm0-5c0-.414-.336-.75-.75-.75h-18.5c-.414 0-.75.336-.75.75s.336.75.75.75h18.5c.414 0 .75-.336.75-.75z" fill-rule="nonzero"/></svg>
                </div>
                <div class="nav">
                    <div id="nav-arcade" class="nav-item active" v-if="showArcadeTab" @click="setArcadeTab">Arcade</div>
                    <div id="nav-chat"  class="nav-item" v-if="showChatTab" @click="setChatTab">Chat</div>
                    <div id="nav-hosting" class="nav-item" v-if="showHostingTab" @click="setHostingTab">Hosting</div>
                    <div id="nav-settings" class="nav-item" v-if="showSettingsTab" @click="setSettingsTab">Settings</div>
                    <div id="nav-help" class="nav-item" v-if="showHelpTab" @click="openExternal('https://mickeyuk.com/arcade/help')">Help</div>
                </div>
            </div>
            <iframe ref="iframeRef" :src="url" frameborder="0" width="100%" height="100%"></iframe>
            <div ref="windowRef" id="window-content" style="display: none;">
                <div class="container" style="margin: 0 auto; padding: 20px;">
                    <Settings />
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

.hidden {
    display: none;
}

@media (max-width: 992px) {
    .container {
        max-width: 100% !important;
        padding: 20px !important;
    }
}
</style>