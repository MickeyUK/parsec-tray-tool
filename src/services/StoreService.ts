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
        roomToken: null | string,
        roomTokenExpiry: number,
        parsecUsername: null | string,
        version: string,
    } = {
        acceptAll: true,
        banned: [],
        roomToken: null,
        roomTokenExpiry: 0,
        parsecUsername: null,
        version: '1.0.3',
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

            // Load the settings
            this.config = config;

            // Old outdated settings?
            if (!this.config.version) {
                this.config = {
                    acceptAll: true,
                    banned: [],
                    roomToken: null,
                    roomTokenExpiry: 0,
                    parsecUsername: null,
                    version: '1.0.3',
                };
            }

            this._setToken();

        } else {
            console.log("No config found");

            // Set token
            this._setToken();
        }

        await tauri.invoke('set_auto_accept', {
            autoAccept: this.config.acceptAll,
        }).catch((error) => {
            console.error(error);
        });

    }

    /**
     * @description Set the token for creating/updating the room.
     */
    private async _setToken() {

        // Token is valid
        if (this.config.roomToken && this.config.roomTokenExpiry > Date.now()) {
            return;
        }

        // Get a new token
        this.config.roomToken = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        // Set expiry
        this.config.roomTokenExpiry = Date.now() + (1000 * 60 * 60 * 24);

        // Save
        this.save();

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

}

export default StoreService.getInstance();