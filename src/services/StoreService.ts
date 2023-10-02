import { Store } from "tauri-plugin-store-api";
import { tauri } from "@tauri-apps/api";

import User from "@/models/User";
import GuestStatus from "@/models/GuestStatus";
import Room from "@/models/Room";

class StoreService {
    
    /**
     * The singleton instance.
     */
    private static _instance: StoreService;

    /**
     * Get the singleton instance.
     */
    public static getInstance(): StoreService {
        if (!StoreService._instance) {
            StoreService._instance = new StoreService();
        }
        return StoreService._instance;
    }

    /**
     * @description The settings
     */
    public config: {
        acceptAll: boolean,
        banned: GuestStatus[],
        calls: number,
        lastCall: number,
        room: Room | undefined,
        session: string | undefined,
    } = {
        acceptAll: true,
        banned: [],
        calls: 0,
        lastCall: 0,
        room: undefined,
        session: undefined,
    };

    public windowVisible: boolean = true;

    /**
     * @description The recent guests in the room.
     */
    public recentGuests: GuestStatus[] = [];

    /**
     * @description The configuration store file.
     */
    public _store = null as unknown as Store;

    /**
     * @description Read the settings from the store.
     */
    public async init() {

        // Load settings
        this._store = new Store('config.dat');
        const config = await this._store.get('config') as any;
        if (config) {
            this.config = config;

            // Are people being dopes and not updating host name...? ¬_¬
            if (typeof this.config.room?.host === 'object') {
                this.config.room.host = '';
            }

        } else {
            console.log("No config found");
        }

        await tauri.invoke('set_auto_accept', {
            autoAccept: this.config.acceptAll,
        }).catch((error) => {
            console.error(error);
        });

    }

    /**
     * @description Save the settings to the store.
     */
    public async save() {
        this._store.set('config', this.config);
        this._store.save();
        tauri.invoke('set_auto_accept', {
            autoAccept: this.config.acceptAll,
        }).catch((error) => {
            console.error(error);
        });
    }

    /**
     * @description Ban a guest from the room.
     * @param user The user to ban.
     */
    public banGuest(user: User) {
        var guest = new GuestStatus(user, 'banned');
        guest.timestamp = Date.now();
        this.config.banned.push(guest);
        this.save();
    }

    /**
     * @description Unban a guest from the room.
     * @param user The user to unban.
     */
    public unbanGuest(user: User) {
        this.config.banned = this.config.banned.filter((banned) => banned.user.id !== user.id);
        this.save();
    }

    /**
     * @description Check if a guest is banned from the room.
     * @param user The user to check.
     */
    public isBanned(user: User) {
        return this.config.banned.find((banned) => banned.user.id === user.id) ? true : false;
    }

    /**
     * @description Check if the user has hit the limit for the cloud function.
     */
    public hitLimit() {

        // 10 calls per 15 minutes
        if (this.config.lastCall === 0 || Date.now() - this.config.lastCall > 900000) {
            this.config.calls = 0;
            this.config.lastCall = Date.now();
            this.save();
            return false;
        }

        if (this.config.calls >= 10) {
            return true;
        }

        this.config.calls++;
        this.config.lastCall = Date.now();
        this.save();
        return false;

    }

}

export default StoreService.getInstance();