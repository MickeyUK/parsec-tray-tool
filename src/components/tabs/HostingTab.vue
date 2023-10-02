<script lang="ts">
import { defineComponent } from 'vue';

import Helper from '@/modules/Helper';

import StoreService from '@/services/StoreService';
import FirebaseService from '@/services/FirebaseService';
import HostingService from '@/services/HostingService';

import User from '@/models/User';
import Room from '@/models/Room';

export default defineComponent({
  name: 'HostingTab',
  data() {
    return {
      roomSet: HostingService.currentRoom ? true : false,
      currentRoom: HostingService.currentRoom,
      settings: StoreService.config.room ? StoreService.config.room : new Room('', '', 1, '', '')
    }
  },
  methods: {
    async thumbnailSearch() {

      // Rate limit
      if (StoreService.hitLimit()) {
        Helper.toastError('You are searching too fast/often. Please try again in 15 minutes.');
        return;
      }

      // Disable thumbnail search
      (this.$refs.thumbnailFormRef as HTMLFormElement).classList.add('disabled');

      // Get search query
      const searchQuery = (this.$refs.thumbnailSearchRef as HTMLInputElement).value;
      if (searchQuery.length < 3 || searchQuery.length > 30) {
        Helper.toastError('Search query must be between 3 and 30 characters.');
        return;
      }

      // Search for thumbnail
      FirebaseService.getThumbnail(searchQuery).then((thumbnail: any) => {

        if (thumbnail && thumbnail.length > 0) {

          // Set thumbnail
          (this.$refs.thumbnailRef as HTMLInputElement).value = thumbnail;

          // Update thumbnail image
          const thumbnailImage = document.querySelector('#hosting-tab .tile img') as HTMLImageElement;
          thumbnailImage.src = thumbnail;

        }

        (this.$refs.thumbnailFormRef as HTMLFormElement).classList.remove('disabled');

      }).catch((error) => {
        console.log(error);
        Helper.toastError("The thumbnail search is not currently working. Please try again later!");
      });

    },
    async stopHosting() {

      if (!HostingService.currentRoom) {
        return;
      }

      HostingService.stopHosting();
      
      this.roomSet = false;

    },
    async submitRoom(e: Event) {

      e.preventDefault();

      // Rate limit
      if (StoreService.hitLimit()) {
        Helper.toastError('You are creating/updating rooms too fast/often. Please try again in 15 minutes.');
        return;
      }

      (this.$refs.formRef as HTMLFormElement).classList.add('disabled');
      
      // Convert form data to object
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form) as any;
      const data = Object.fromEntries(formData.entries());

      // Room name between 3 and 30 characters?
      if (data.name.length < 3 || data.name.length > 30) {
        Helper.toastError('Room name must be between 3 and 30 characters.');
        return;
      }

      // Does data.link start with https://parsec.gg/g/?
      if (!data.link.includes('https://parsec.gg/g/')) {
        Helper.toastError('Invalid Parsec link.');
        return;
      }

      // Remove anything that isn't a number from data.guests
      data.guests = data.guests.replace(/\D/g, '');

      // Make sure host no more than 50 characters
      if (data.host.length > 50) {
        Helper.toastError('Host name must be less than 50 characters.');
        return;
      }

      // Create a new room
      var room = new Room(
        data.name, 
        data.host,
        data.guests,
        data.thumbnail,
        data.link,
      );

      // Update room in database
      await HostingService.startHosting(room).then(() => {
        this.roomSet = true;
      }).catch((error) => {
        Helper.toastError('There was an error creating/updating your room. Please try again later.');
      });

      // Scroll hosting-tab to the top
      (this.$refs.hostingRef as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        (this.$refs.formRef as HTMLFormElement).classList.remove('disabled');
      }, 2000);

    }
  },
});
</script>

<template>
  <div ref="hostingRef" id="hosting-tab">

    <div v-if="roomSet" class="notice">
      You are currently hosting a room. Click this button to stop hosting.
      <div class="btn" @click="stopHosting">
        Stop Hosting
      </div>
    </div>

    <form ref="formRef" @submit="submitRoom">
      <div class="col">
        <div class="row">
          <div class="form-group col">
            <label for="hosting">Room Name</label>
            <small id="hostingHelp" class="form-text text-muted">
              Enter a name for your room. Must be between 3 and 30 characters. No profanity allowed!
            </small>
          </div>
          <div class="form-group col">
            <input required type="text" class="form-control" placeholder="eg. Gang Beasts" name="name" :value="settings.title">
          </div>
        </div>

        <div class="row">
          <div class="form-group col">
            <label for="hosting">Host Name</label>
            <small id="hostingHelp" class="form-text text-muted">
              Enter your name or nickname. Must be less than 50 characters. Makes to make it your Parsec name!
            </small>
          </div>
          <div class="form-group col">
            <input required type="text" class="form-control" placeholder="eg. Gang Beasts" name="host" :value="settings.host">
          </div>
        </div>

        <div class="row">
          <div class="form-group col">
            <label for="hosting">Share Link</label>
            <small id="hostingHelp" class="form-text text-muted">
              The share link generated by Parsec. This is required to host a room.
            </small>
          </div>
          <div class="form-group col">
            <input required type="text" class="form-control" placeholder="" name="link" value="">
          </div>
        </div>

        <div class="row">
          <div class="form-group col">
            <label for="hosting">Max Guests</label>
            <small id="hostingHelp" class="form-text text-muted">
              Enter the maximum number of guests allowed in your room.
            </small>
          </div>
          <div class="form-group col">
            <input type="number" class="form-control" name="guests"  :value="settings.guests" min="1">
          </div>
        </div>

        <div class="row">
          <div class="form-group col">
            <label for="hosting">Thumbnail Search</label>
            <small id="hostingHelp" class="form-text text-muted">
              Enter the name of the game you're hosting or suitable keywords to search for a thumbnail.
            </small>
          </div>
          <div ref="thumbnailFormRef" class="form-group col">
            <div style="display:flex; width: 100%; gap: .5rem;">
              <div style="flex:1">
                <input ref="thumbnailSearchRef" type="text" class="form-control" placeholder="eg. Overcooked 2">
                <input ref="thumbnailRef" type="hidden" name="thumbnail" value=""/>
              </div>
              <div class="btn" @click="thumbnailSearch">
                Search
              </div>
            </div>
            <div class="tile" style="margin: 1rem auto;">
              <img 
              :src="(settings.thumbnail.length > 0) ? settings.thumbnail : '/assets/images/tile_placeholder.jpg'" 
              alt="Thumbnail" class="img-fluid">
            </div>
          </div>
        </div>

        <div style="text-align: center;">
          <button ref="submitRef" type="submit" class="btn btn-primary">
            <span v-if="roomSet">Update Room</span>
            <span v-else>Create Room</span>
          </button>
        </div>

      </div>
    </form>
  </div>
</template>

<style scoped>
#hosting-tab {
  max-width: 700px;
  margin: 1rem auto;
}

.row {
  gap: .5rem !important;
}
</style>