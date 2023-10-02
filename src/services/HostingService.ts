import { getVersion } from '@tauri-apps/api/app';
import { tauri } from "@tauri-apps/api";
import { emit, listen } from '@tauri-apps/api/event';

import StoreService from '@/services/StoreService';
import EventService from "@/services/EventService";
import FirebaseService from "@/services/FirebaseService";

import Helper from '@/modules/Helper';

import User from '@/models/User';
import Room from '@/models/Room';
import GuestStatus from '@/models/GuestStatus';
import { Store } from "tauri-plugin-store-api";

class HostingService {

    /**
     * The singleton instance.
     */
    public static instance: HostingService;

    /**
     * The room being hosted.
     */
    public currentRoom: Room | null = null;

    /**
     * The guests in the room.
     */
    public guests: User[] = [];

    /**
     * The version of the app.
     */
    public version: string = '';

    /**
     * Get the singleton instance.
     */
    public static getInstance(): HostingService {
        if (!HostingService.instance) {
            HostingService.instance = new HostingService();
        }
        return HostingService.instance;
    }

    /**
     * Initialize the guest management system.
     */
    public async init() {

        // Start watching the Parsec log file
        tauri.invoke('start_watch').catch((error: any) => {
            console.error(error);
        });

        // Get the app version
        getVersion().then((version: string) => {
            this.version = version;
        });

        // Listen for guest status updates
        listen('guest:status', (data: any) => {
            const status = data.payload as GuestStatus;
            switch (status.status) {
                case 'connecting':
                    this.acceptGuest(status.user);
                    break;
                case 'connected':
                    // Maybe do something here?
                    break;
                case 'disconnected':
                    this.removeGuest(status.user.id);
                    break;
            }
        });
        
    }

    /**
     * Accept a guest's request to join the room.
     * @param user The user to accept.
     */
    public acceptGuest(user: User) {

        // Is the user banned?
        if (StoreService.isBanned(user) || 
        (this.currentRoom && this.guests.length >= this.currentRoom.guests)) {
            // YOU SHALL NOT PASS!
            return;
        }

        // Store the user
        this.addGuest(user);
        EventService.emit('guests:updated');

    }

    /**
     * Add a guest to the room.
     * @param user The user to add.
     */
    public addGuest(user: User) {

        // Is the user already in the room?
        if (this.guests.find((u: User) => u.id === user.id)) {
            return;
        }

        // Add to recent guests
        StoreService.recentGuests.push(new GuestStatus(user, 'connected'));

        // Add the user
        this.guests.push(user);
        EventService.emit('guests:updated');

    }

    /**
     * Remove a guest from the room.
     * @param userId The user ID to remove.
     */
    public removeGuest(userId: string) {    
        this.guests = this.guests.filter((u: User) => u.id !== userId);
        EventService.emit('guests:updated');
    }

    /**
     * Adds/updates the room in the database.
     * @param room The room to add/update.
     */
    public async startHosting(room: Room) {

        // Is the user already hosting a room?
        if (this.currentRoom) {
            this.updateRoom(room);
            return;
        }

        // Set room version
        room.version = this.version;
    
        // Add room to database
        FirebaseService.addRoom(room).then((roomId: any) => {

            // Get the room ID from Firebase
            room.id = roomId;
            this.currentRoom = room;

            // Save the room to the config
            StoreService.config.room = new Room(room.title, room.host, room.guests, room.thumbnail, '');
            StoreService.save();

            // Update the UI
            Helper.toastSuccess('Room created successfully.');
            EventService.emit('host');
            EventService.emit('tab', { tab: 2 });

        })
        .catch((error) => {
            console.error(error);
        });

    }

    /**
     * Updates the room in the database.
     * @param room The room to update.
     */
    public async updateRoom(room: Room) {

        if (!this.currentRoom) {
            return;
        }

        // Update the room
        room.updatedAt = Date.now();
        FirebaseService.updateRoom(room).then(() => {

            // Set the current room
            this.currentRoom = room;
            
            // Update the config
            StoreService.config.room = new Room(room.title, room.host, room.guests, room.thumbnail, '');
            StoreService.save();

            // Update the UI
            Helper.toastSuccess('Room updated successfully.');
            EventService.emit('tab', { tab: 2});

        }).catch((error) => {
            console.error(error);
        });

    }
    
    /**
     * Stop hosting the room.
     */
    public stopHosting(): void {

        // Is the user hosting a room?
        if (!this.currentRoom) {
            return;
        }

        // Remove from database
        FirebaseService.deleteRoom(this.currentRoom);

        // Clear the current room
        this.guests = [];
        this.currentRoom = null;
        Helper.toastSuccess('You are no longer hosting a room.');

        EventService.emit('host');

    }
    
}

export default HostingService.getInstance();