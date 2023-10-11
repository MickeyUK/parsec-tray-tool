<script lang="ts">
import { defineComponent } from 'vue';
import { writeText } from '@tauri-apps/api/clipboard';

import Helper from '@/services/Helper';

import StoreService from '@/services/StoreService';
import EventService from '@/services/EventService';

import GuestStatus from '@/models/GuestStatus';
import User from '@/models/User';

export default defineComponent({
  name: 'Settings',
  data() {
    return {
      activePill: 0,
      acceptAll: StoreService.config.acceptAll,
      recentGuests: StoreService.recentGuests as GuestStatus[],
      bannedGuests: StoreService.config.banned as GuestStatus[],
      updateEvent: null as any
    };
  },
  methods: {
    toggleAcceptAll() {
      this.acceptAll = !this.acceptAll;
      StoreService.config.acceptAll = this.acceptAll;
      StoreService.save();
    },
    setActivePill(index: number) {
      this.activePill = index;

      // Remove active class from all nav items
      let navItems = document.getElementsByClassName('pill');
      for (let i = 0; i < navItems.length; i++) {
        navItems[i].classList.remove('active');
      }

      // Add active class to nth pill
      navItems[index].classList.add('active');
      
    },
    async copyToClipboard(text: string) {
      writeText(text).then(() => {
        Helper.toastSuccess('Username copied to clipboard!');
      }).catch(error => {
        console.error(error);
      });
    },
    banGuest(user: User) {
      if (StoreService.isBanned(user)) {
        StoreService.unbanGuest(user);
      } else {
        StoreService.banGuest(user);
      }
      this.recentGuests = [...StoreService.recentGuests];
      this.bannedGuests = [...StoreService.config.banned];
    },
    isBanned(user: User): boolean {
      return StoreService.isBanned(user);
    },
    formatTimestamp(timestamp: any) {
      return Helper.formatTimestamp(timestamp);
    },
  },
  mounted() {

    // Update guests
    this.updateEvent = () => {
      this.recentGuests = [...StoreService.recentGuests];
      this.bannedGuests = [...StoreService.config.banned];
      console.log('updated guests');
    };
    EventService.on('guests:updated', this.updateEvent);

    console.log(StoreService.recentGuests);

    this.setActivePill(0);

  },
  beforeUnmount() {
    EventService.off('guests:updated', this.updateEvent);
  }
});
</script>

<template>
    <div id="guests-tab">
      <div class="col">

        <div class="form-group">
          <div class="form-checkbox">
            <input type="checkbox" class="form-control" id="guests" name="acceptAll" :checked="acceptAll" @change="toggleAcceptAll">
            <label for="guests" class="form-label">Accept Guests Automatically</label>
          </div>
          <div class="form-text">
            If checked, all users joining will be accepted automatically. If unchecked, banned users will still be able to join.
          </div>
        </div>

        <div class="pills">
          <div class="nav-item pill active" @click="setActivePill(0)">Recent Guests</div>
          <div class="nav-item pill" @click="setActivePill(1)">Banned Guests</div>
        </div>

        <div class="pill-container">
          <div class="pill-content" v-if="activePill == 0">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="recentGuests.length < 1">
                  <td colspan="3" style="text-align: center; padding: 1rem;" class="muted">No recent guests</td>
                </tr>
                <tr v-for="guest in recentGuests" :guest="guest">
                  <td>
                    <span class="user" title="Click to copy username to clipboard" @click="copyToClipboard(`${guest.user.id}#${guest.user.name}`)">
                      <span class="id">{{ guest.user.id }}#</span>
                      <span class="name">{{ guest.user.name }}</span>
                    </span>
                  </td>
                  <td>
                    {{ formatTimestamp(guest.timestamp) }}
                  </td>
                  <td style="text-align: center">
                    <button class="btn" @click="banGuest(guest.user)">
                      <span v-if="isBanned(guest.user)">Unban</span>
                      <span v-else>Ban</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pill-content" v-if="activePill == 1">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Banned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="bannedGuests.length < 1">
                  <td colspan="3" style="text-align: center; padding: 1rem;" class="muted">No banned users</td>
                </tr>
                <tr v-for="guest in bannedGuests" :guest="guest">
                  <td>
                    <span class="user" title="Click to copy username to clipboard" @click="copyToClipboard(`${guest.user.name}#${guest.user.id}`)">
                      <span class="name">{{ guest.user.name }}#</span>
                      <span class="id">{{ guest.user.id }}</span>
                    </span>
                  </td>
                  <td>
                    {{ formatTimestamp(guest.timestamp) }}
                  </td>
                  <td style="text-align: center">
                    <button class="btn" @click="banGuest(guest.user)">Unban</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
</template>

<style>
.pills {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
}

.pills .pill-item {
    display: inline-flex;
}
</style>