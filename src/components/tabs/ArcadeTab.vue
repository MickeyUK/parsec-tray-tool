<script lang="ts">
import { defineComponent } from 'vue';

import ArcadeService from '@/services/ArcadeService';
import StoreService from '@/services/StoreService';

import Room from '@/models/Room';

export default defineComponent({
  name: 'ArcadeTab',
  data() {
    return {
      rooms: [] as Room[],
      interval: null as any
    };
  },
  methods: {
    joinRoom(link: string) {
      ArcadeService.joinRoom(link);
    }
  },
  mounted() {
    
    // Get rooms
    ArcadeService.getRooms().then((response: any) => {
      this.rooms = [...response];
    });

    // Start interval every 59 seconds
    this.interval = setInterval(() => {
      if (StoreService.windowVisible === false) return;
      this.rooms = [];
      setTimeout(() => {
        ArcadeService.getRooms().then((response: any) => {
          this.rooms = [...response];
        });
      }, 1);
    }, 59000);

  },
  beforeUnmount() {
    clearInterval(this.interval);
  }
});
</script>

<template>
    <div id="arcade-tab">
        <div class="grid">

          <template v-if="rooms.length === 0">
            <div class="no-rooms">
              <i class="fa-solid fa-couch" style="font-size: 48px;"></i><br>
              <h2>Nobody is hosting right now :(</h2>
            </div>
          </template>

          <div v-for="room in rooms" :room="room" class="room">
            <div class="tile">
              <img :src="room.thumbnail !== '' ? room.thumbnail : '/assets/images/tile_placeholder.jpg'" />
            </div>
            <div class="room-name">{{ room.title }}</div>
            <div class="guest-count">
              <i class="fa-solid fa-couch"></i>{{ room.guests }}
            </div>
            <div class="tile-overlay">
              <div class="room-info">
                <div><i class="fa-solid fa-user"></i>  {{ room.host }}</div>
                <div><i class="fa-solid fa-couch"></i>  {{ room.guests }}</div>
              </div>
              <div class="btn" @click="joinRoom(room.link)">
                Join Room
              </div>
            </div>
          </div>

        </div>
    </div>
</template>

<style scoped>
.no-rooms {
  text-align: center;
}

.room {
  position: relative;
}

.room-name {
  margin-top: 5px;
  width: 175px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.guest-count {
  position: absolute;
  bottom: 2rem;
  right: .75rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tile-overlay {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: 175px;
  height: 175px;
  background: rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.room-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.room-info i {
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.room:hover .tile-overlay {
  opacity: 1;
  pointer-events: all;
  transition: opacity 0.2s ease-in-out;
}
</style>