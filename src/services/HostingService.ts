import { tauri } from "@tauri-apps/api";
import { listen } from '@tauri-apps/api/event';

import StoreService from '@/services/StoreService';
import EventService from "@/services/EventService";

import User from '@/models/User';
import GuestStatus from '@/models/GuestStatus';

class HostingService {

    /**
     * The singleton instance.
     */
    public static instance: HostingService;

    /**
     * The guests in the room.
     */
    public guests: User[] = [];

    /**
     * Max guests allowed in the room.
     */
    public maxGuests: number = 99;

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
    public async acceptGuest(user: User) {

        // Is the user banned?
        if (StoreService.isBanned(user)) {
            // YOU SHALL NOT PASS!
            return;
        }

        // Store the user
        this.addGuest(user);
        EventService.emit('guests:updated');

        // Tell backend to add the user
        await fetch('https://mickeyuk.com/api/arcade/room/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room_token: StoreService.config.roomToken,
                user_id: user.id,
            }),
        });

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
        console.log(`Added ${user.name} to the room`);

    }

    /**
     * Remove a guest from the room.
     * @param userId The user ID to remove.
     */
    public async removeGuest(userId: string) {    
        this.guests = this.guests.filter((u: User) => u.id !== userId);
        EventService.emit('guests:updated');

        // Tell backend to remove the user
        await fetch('https://mickeyuk.com/api/arcade/room/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room_token: StoreService.config.roomToken,
                user_id: userId,
            }),
        });

    }
    
}

export default HostingService.getInstance();